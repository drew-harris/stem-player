let runButton = document.getElementById("run-button");
runButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  links = document.getElementById("links-field").value.split("\n");
  chrome.storage.local.set({ links: links }, function () {
    console.log("Value is set to " + links);
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: uploadLinks,
  });
});

let fileButton = document.getElementById("file-button");
fileButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: files,
  });
});

////////////////////////////////////////////////////////////////////////////////
//                               File Upload
////////////////////////////////////////////////////////////////////////////////
async function files() {
  async function uploadFiles() {
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
    var files = myFileForm.files;
    var songs = [];
    var songIndex = 0;

    var track = [];
    for (var i = files.length - 1; i >= 0; i--) {
      if (files[i].type.includes("audio")) {
        track.push(files[i]);
        if (track.length === 4) {
          songs.push(track);
          track = [];
        }
      }
    }
    myFileForm.style.visibility = "hidden";
    submitFolderButton.style.visibility = "hidden";

    // Upload all songs
    for (var i = 0; i < songs.length; i++) {
      console.log(songs[i]);
      extDisplay.innerHTML = "Uploading " + (i + 1) + " of " + songs.length;
      songDisplay.innerHTML = songs[i][3].name;
      var fileData = new DataTransfer();
      for (var j = 0; j < songs[i].length; j++) {
        fileData.items.add(songs[i][j]);
      }
      var fileInput = document.querySelector("#file");
      fileInput.files = fileData.files;
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      var form = document.querySelector(
        "#main > div > div.track-manager > div > div > form"
      );
      form.requestSubmit();
      await waitForUpload(form);
    }
    extDisplay.innerHTML = "Uploaded " + songs.length + " songs";
    songDisplay.innerHTML = "";
  }
  let myStuff = document.createElement("div");
  myStuff.style.marginBottom = "40px";
  let myFileForm = document.createElement("input");
  myFileForm.setAttribute("directory", "");
  myFileForm.setAttribute("webkitdirectory", "");
  let selectFolderButton = document.createElement("div");

  let submitFolderButton = document.createElement("div");
  selectFolderButton.innerHTML = "[SELECT FOLDER]";
  selectFolderButton.style.textAlign = "center";
  selectFolderButton.style.marginBottom = "20px";
  submitFolderButton.style.textAlign = "center";
  selectFolderButton.style.cursor = "pointer";
  submitFolderButton.style.cursor = "pointer";
  submitFolderButton.style.visibility = "hidden";
  submitFolderButton.innerHTML = "[UPLOAD ALBUM]";
  selectFolderButton.addEventListener("click", () => {
    myFileForm.click();
  });
  myFileForm.addEventListener("change", () => {
    console.log(myFileForm.files);
    selectFolderButton.innerHTML =
      myFileForm.files[0].webkitRelativePath.split("/")[0];
    submitFolderButton.style.visibility = "visible";
  });
  submitFolderButton.addEventListener("click", uploadFiles);
  myStuff.appendChild(selectFolderButton);
  myStuff.appendChild(submitFolderButton);
  myFileForm.type = "file";
  var extDisplay = document.createElement("div");
  var songDisplay = document.createElement("div");
  extDisplay.innerHTML = "";
  extDisplay.style.textAlign = "center";
  extDisplay.style.margin = "20px";
  extDisplay.style.textDecoration = "underline";
  songDisplay.innerHTML = "";
  songDisplay.style.textAlign = "center";
  songDisplay.style.margin = "20px";
  myStuff.appendChild(extDisplay);
  myStuff.appendChild(songDisplay);
  let bigGroup = document.querySelector(
    "#main > div > div.track-manager > div > div"
  );
  bigGroup.insertBefore(myStuff, bigGroup.children[1]);
  try {
  } catch (err) {
    alert(err.message);
  }
}

////////////////////////////////////////////////////////////////////////////////
//                               Link Upload
////////////////////////////////////////////////////////////////////////////////
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
