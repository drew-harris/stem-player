let runButton = document.getElementById("run-button");
runButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  links = document.getElementById("links-field").value.split("\n");
  chrome.storage.local.set({ links: links }, function () {
    console.log("Value is set to " + links);
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: upload,
  });
});

async function uploadLinks() {
  try {
    function retrieveLinks() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get("links", function (result) {
          resolve(result.links);
        });
      });
    }

    function waitForUpload(target) {
      return new Promise((resolve) => {
        observer = new MutationObserver(() => {
          var newDoc = document.querySelector(
            "#main > div > div.track-manager > div > div > form > button:nth-child(3) > span"
          );
          if (newDoc.innerText === "UPLOADED") {
            observer.disconnect();
            resolve("Done");
          }
        });
        observer.observe(target, {
          attributes: true,
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: true,
        });
      });
    }
    console.log(window.location.href);
    if (!window.location.href.includes("connect")) {
      throw new Error('Make sure you are on the page that says "LINK OR FILE"');
    }

    // Get the links from chrome storage
    var links = await retrieveLinks();
    if (links[0].length < 5) {
      throw new Error("No links found");
    }

    // Reset local storage
    chrome.storage.local.set({ links: null }, function () {
      console.log("Value is set to " + links);
    });

    // Custom injected element
    var formGroup = document.querySelector(
      "#main > div > div.track-manager > div > div > form"
    );
    var extDisplay = document.createElement("div");
    extDisplay.classList.add("button--text");
    formGroup.insertBefore(extDisplay, formGroup.children[0]);
    extDisplay.innerText = "";
    extDisplay.style.textAlign = "center";
    extDisplay.style.textDecoration = "underline";
    extDisplay.style.marginBottom = "40px";

    for (let i = 0; i < links.length; i++) {
      extDisplay.innerText = "Uploading " + (i + 1) + " of " + links.length;
      var result = document.querySelector(
        "#main > div > div.track-manager > div > div > form > div > label:nth-child(1) > span"
      );
      result.click();
      var formField = document.getElementById("link-input");
      formField.value = links[i];
      formField.dispatchEvent(new Event("input", { bubbles: true }));
      formField.dispatchEvent(new Event("change", { bubbles: true }));

      var form = document.querySelector(
        "#main > div > div.track-manager > div > div > form"
      );
      form.requestSubmit();

      var percentage = document.querySelector(
        "#main > div > div.track-manager > div > div > form"
      );
      const isDone = await waitForUpload(percentage);

      const addNew = document.querySelector(
        "#main > div > div.track-manager > div > div > form > button.button.button--text.stripped-splitter__button.stripped-splitter__button--reset.stripped-splitter__button--show"
      );
      addNew.click();
    }
    chrome.storage.local.set({ links: null }, function () {
      console.log("Value is set to " + links);
    });
    extDisplay.innerText = "UPLOADING ALL FILES COMPLETE";
  } catch (error) {
    alert(error.message);
  }
}
