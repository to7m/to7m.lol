<?php



define("MANIFEST_PATH", "/home/tomlol/misc/redirector/manifest.json");


function getLogPath($target) {
    return "/home/tomlol/misc/redirector/instances/$target.json";
}


function _getLockedManifest() {
    $manifestFile = fopen(MANIFEST_PATH, "c+");

    if ($manifestFile === false) {
        exit("failed to open manifest");
    }

    if (!flock($manifestFile, LOCK_EX)) {
        exit("failed to lock manifest");
    }

    return $manifestFile;
}


function _getIp() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }

    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    return $_SERVER['REMOTE_ADDR'];
}


function _logVisit($target, $origin) {
    $path = getLogPath($target);
    $datetime = explode(" ", date("Y-m-d H:i:s"));
    $date = $datetime[0];
    $time = $datetime[1];
    $ip = getIp();

    $redirectorLog = json_decode(file_get_contents($path), true);
    $redirectorLog[] = [$date, $time, $ip, $origin];
    file_put_contents($path, json_encode($redirectorLog, JSON_PRETTY_PRINT));
}


function _rejectArg($errorMsg) {
    http_response_code(400);  // Bad Request
    echo json_encode(["error" => $errorMsg]);
    exit();
}


function _verifyArgFormatting($argName, $arg) {
    if (strlen($arg) < 1 || strlen($arg) > 100) {
        _rejectArg(
            "$argName should be between 1 and 100 characters long"
        );
    }

    if (!preg_match("/[a-zA-Z_]/", $arg[0])) {
        _rejectArg(
            "$argName should start with a letter (a–z, A–Z) or an underscore"
        );
    };

    if (!preg_match("/^[a-zA-Z0-9._-]*$/", $arg)) {
        _rejectArg(
            "$argName should only contain letters (a–z, A–Z), digits, full stops, underscores, or hyphens"
        );
    }
}


function getMakeRedirector() {
    include "/home/tomlol/misc/redirector/templates/make-redirector.php";
}


function tryGetRedirect($target, $origin) {
    $manifestFile = _getLockedManifest();
    $manifestJson = json_decode(stream_get_contents($manifestFile));

    foreach ($manifestJson as list($potentialTarget, $url, $_)) {
        if ($potentialTarget === $target) {
            include "/home/tomlol/misc/redirector/templates/redirect.php";
            _logVisit($target, $origin);

            return;
        }
    }

    include "/home/tomlol/misc/redirector/templates/missing-redirector.php";
}


function tryGetAdminView($target, $password, $created, $saved) {
    $manifestFile = _getLockedManifest();
    $manifestJson = json_decode(stream_get_contents($manifestFile));

    foreach ($manifestJson as list($potentialTarget, $url, $potentialPassword)) {
        if ($potentialTarget === $target) {
            if ($password === $potentialPassword) {
                include "/home/tomlol/misc/redirector/templates/admin-view.php";
            } else {
                include "/home/tomlol/misc/redirector/templates/wrong-admin-password.php";
            }

            return;
        }
    }

    include "/home/tomlol/misc/redirector/templates/missing-redirector.php";
}


function tryCreateRedirect($target, $url, $password) {
    _verifyArgFormatting("target", $target);
    _verifyArgFormatting("password", $password);

    $manifestFile = _getLockedManifest();
    $manifestJson = json_decode(stream_get_contents($manifestFile));

    foreach($manifestJson as list($potentialTarget, $_, $_)) {
        if ($potentialTarget === $target) {
            http_response_code(409);  // Conflict
            echo json_encode(["error" => "target name $target is already taken"]);
            return;
        }
    }

    $manifestJson[] = [$target, $url, $password];
    file_put_contents(MANIFEST_PATH, json_encode($manifestJson, JSON_PRETTY_PRINT));

    $instancePath = "/home/tomlol/misc/redirector/instances/$target.json";
    file_put_contents($instancePath, json_encode([], JSON_PRETTY_PRINT));

    header("Location: redirector.php?target=$target&password=$password&created");
}


function tryEditRedirect($target, $newUrl, $oldPassword, $newPassword) {
    _verifyArgFormatting("password", $newPassword);

    $manifestFile = _getLockedManifest();
    $manifestJson = json_decode(stream_get_contents($manifestFile));

    foreach($manifestJson as $i => list($potentialTarget, $_, $potentialOldPassword)) {
        if ($potentialTarget === $target) {
            if ($potentialOldPassword === $oldPassword) {
                $manifestJson[$i] = [$target, $newUrl, $newPassword];
                file_put_contents(MANIFEST_PATH, json_encode($manifestJson, JSON_PRETTY_PRINT));

                header("Location: redirector.php?target=$target&password=$newPassword&saved");
            } else {
                http_response_code(401);  // Unauthorized
                echo json_encode(["error" => "password $oldPassword was incorrect"]);
            }

            return;
        }
    }

    http_response_code(404);  // Not Found
    echo json_encode(["error" => "redirector $target not found"]);
}


function tryDeleteRedirect($target, $password) {
    $manifestFile = _getLockedManifest();
    $manifestJson = json_decode(stream_get_contents($manifestFile));

    foreach ($manifestJson as $i => list($potentialTarget, $_, $potentialPassword)) {
        if ($potentialTarget === $target) {
            if ($password === $potentialPassword) {
                unset($manifestJson[$i]);
                $manifestJson = array_values($manifestJson);

                unlink(getLogPath($target));

                include "/home/tomlol/misc/redirector/templates/redirector-deleted.php";
            } else {
                http_response_code(401);  // Unauthorized
                echo json_encode(["error" => "password $password was incorrect"]);
            }

            return;
        }
    }

    http_response_code(404);  // Not Found
    echo json_encode(["error" => "redirector $target not found"]);
}


function getRedirectorDeleted() {
    include "/home/tomlol/misc/redirector/templates/redirector-deleted.php";
}


if (isset($_GET["target"])) {
    if (isset($_GET["password"])) {
        tryGetAdminView(
            $_GET["target"], $_GET["password"], isset($_GET["created"]), isset($_GET["saved"])
        );
    } else {
        if (isset($_GET["origin"])) {
            tryGetRedirect($_GET["target"], $_GET["origin"]);
        } else {
            tryGetRedirect($_GET["target"], "");
        }
    }
} elseif (isset($_POST["action"])) {
    switch ($_POST["action"]) {
        case "create":
            tryCreateRedirect(
                $_POST["target"], $_POST["url"], $_POST["password"]
            );
            break;
        case "edit":
            tryEditRedirect(
                $_POST["target"], $_POST["new-url"], $_POST["old-password"], $_POST["new-password"]
            );
            break;
        case "delete":
            tryDeleteRedirect(
                $_POST["target"], $_POST["password"]
            );
            break;
        case "deleted":
            getRedirectorDeleted();
    }
} else {
    getMakeRedirector();
}



?>