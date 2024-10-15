<!DOCTYPE HTML>
<html lang="en-GB">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="generated-css/redirector.css?v=!VERSION_STRING">
  <title>Redirector — Make New Redirector</title>
</head>

<body>
  <header>
    <h1>Redirector</h1>
    <span role="doc-subtitle">Make New Redirector</span>
  </header>
  <main>
    <form id="new-redirector-form">
      <label for="target">Target name:</label>
      <input type="text" id="target" name="target" value="wikipedia-test-<?php echo date("YmdHis"); ?>" maxlength="100" required>

      <label for="url">Target URL:</label>
      <input type="url" id="url" name="url" value="https://en.wikipedia.org/" required>

      <label for="password">UNENCRYPTED PLAINTEXT password:</label>
      <input type="text" id="password" name="password" value="password123" maxlength="100" required>

      <button type="submit">Make redirector</button>
    </form>
    <section id="result"></section>
  </main>

  <script>
    const form = document.getElementById("new-redirector-form");
    const result = document.getElementById("result");


    form.addEventListener("submit", event => {
        event.preventDefault();

        const formData = new FormData(form);
        formData.append("action", "create");

        fetch("redirector.php", {method: "POST", body: formData})
        .catch(error => { result.innerHTML = `Redirector not created: ${error}`; });
    });


    form.style.display = "block";
  </script>
</body>

</html>