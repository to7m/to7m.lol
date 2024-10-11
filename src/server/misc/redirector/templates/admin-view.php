<?php



$path = "/home/tomlol/misc/redirector/instances/$target.json";
$redirectorLog = json_decode(file_get_contents($path), true);

$uniqueIpsForOrigins = [];
foreach ($redirectorLog as list($date, $time, $ip, $origin)) {
    if (!array_key_exists($origin, $uniqueIpsForOrigins)) {
        $uniqueIpsForOrigins[$origin] = [];
    }

    $uniqueIpsForOrigins[$origin][$ip] = true;
}

$uniqueIpCountsForOrigins = [];
foreach ($uniqueIpsForOrigins as $origin => $ipsList) {
    $uniqueIpCountsForOrigins[$origin] = count(array_keys($ipsList));
}
ksort($uniqueIpCountsForOrigins);


?>



<!DOCTYPE HTML>
<html lang="en-GB">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="generated-css/redirector.css">
  <title>Redirector — Admin View for <?php echo $target; ?></title>
</head>

<body>
  <header>
    <h1>Redirector</h1>
    <span role="doc-subtitle">Admin View for <?php echo $target; ?></span>
    <?php
      if ($saved) {
        echo "<p>Saved successfully</p>";
      } elseif ($created) {
        echo "<p>Created successfully</p>";
      }
    ?>
  </header>
  <main>
    <form id="edit-redirector-form">
      Target name:
      <?php echo $target; ?>

      <label for="new-url">Target URL:</label>
      <input type="url" id="new-url" name="new-url" value="<?php echo $url; ?>" required>

      <label for="new-password">UNENCRYPTED PLAINTEXT password:</label>
      <input type="text" id="new-password" name="new-password" value="<?php echo $password; ?>" maxlength="100" required>

      <button type="button" id="save">Save</button>
      <button type="button" id="delete">Delete <?php echo $target; ?> redirector completely</button>
    </form>
    <section id="result"></section>
    <ul>
      <li>
        Example redirect link:
        <?php
          $exampleRedirectLink = "https://to7m.lol/redirector.php?target=$target&amp;origin=_EXAMPLE-ORIGIN-NAME";
          echo "<a href=\"$exampleRedirectLink\">$exampleRedirectLink</a>";
        ?>
      </li>
      <li>
        Admin view:
        <?php
          $adminView = "https://to7m.lol/redirector.php?target=$target&amp;password=$pasword";
          echo "<a href=\"$adminView\">$adminView</a>";
        ?>
      </li>
    </ul>
    <table>
      <tr>
        <th>Origin name</th>
        <th>Unique IP address click count</th>
      </tr>
      <?php
        foreach ($uniqueIpCountsForOrigins as $origin => $uniqueIpCount) {
          echo "<tr><td>$origin</td><td>$uniqueIpCount</td></tr>";
        }
      ?>
    </table>
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>IP address</th>
        <th>Origin name</th>
      </tr>
      <?php
        foreach ($redirectorLog as list($date, $time, $ip, $origin)) {
          echo "<tr><td>$date</td><td>$time</td><td>$ip</td><td>$origin</td></tr>";
        }
      ?>
    </table>
  </main>

  <script>
    const form = document.getElementById("edit-redirector-form");
    const newUrl = document.getElementById("new-url");
    const newPassword = document.getElementById("new-password");
    const save = document.getElementById("save");
    const delete = document.getElementById("delete");


    save.addEventListener("click", () => {
        const formData = new FormData();
        formData.append("action", "edit");
        formData.append("target", "<?php echo $target; ?>");
        formData.append("new-url", newUrl);
        formData.append("old-password", "<?php echo $password; ?>");
        formData.append("new-password", newPassword);

        fetch("redirector.php", {method: "POST", body: formData});
        .catch(error => { result.innerHTML = `Redirector not saved: ${error}`; });
    })


    delete.addEventListener("click", () => {
        const formData = new FormData();
        formData.append("target", "<?php echo $target; ?>");
        formData.append("password", "<?php echo $password; ?>");

        fetch("redirector.php", {method: "POST", body: formData});
        .catch(error => { result.innerHTML = `Redirector not deleted: ${error}`; });
    })


    form.style.display = "block";
  </script>
</body>

</html>
