# Install PAMC Dhamma Books

## Upload the website update

1. Extract `Dhamma-Books-Web-App.zip`.
2. Open the `PAMCSG/Dhamma-Books` repository on GitHub and choose **Add file → Upload files** at the repository root.
3. Upload the files from the extracted folder. Replace `index.html` and `README.md`, and add the other files alongside them. Do not upload the ZIP itself or put the files inside an extra folder.
4. Commit the upload and wait for the usual website deployment to finish.
5. Open https://pamcsg.github.io/Dhamma-Books/ and refresh. The catalogue should show the closed-book-and-Ashoka-pillar icon and **Dhamma Books App / 佛法书籍应用APP** and **Install app / 安装应用**.

This package starts from main commit `b480e82872dd715fd31cf3c6b8d0b953fe60627f`. If someone has changed `index.html` or `README.md` since that commit, reapply the installation additions to the newer files rather than replacing their later changes.

## Android phone

1. Open the published catalogue in **Chrome**, rather than an embedded browser inside a messaging app.
2. Tap **Install app / 安装应用**. If Chrome offers its installation prompt, complete it.
3. If the page instead shows instructions, use Chrome's **⋮** menu and choose **Install app**, or **Install and create shortcut → Install**. Labels vary by Chrome version. Some versions use **Add to Home screen → Install**.
4. Open **Dhamma Books** from its new icon. It should open the catalogue in its own app window. Open a book from the catalogue to check that it stays inside that window.

The website cannot force a native install prompt. Chrome decides whether to offer it, considering factors such as browser support and site engagement. The “How to install” row is removed. Manual instructions appear only after tapping the installation button when needed.

## iPhone or iPad

1. Open the published catalogue in **Safari**.
2. Choose **Share → Add to Home Screen**.
3. Enable **Open as Web App** if that option appears, then choose **Add**.
4. Open the new home-screen icon.

## Computer

In Chrome or Edge, open the catalogue and use the install icon in the address bar or the installation option in the browser menu.

## Book updates

Continue updating the existing book files in GitHub. After the website deployment finishes, refresh or reopen the relevant book to load the published correction. No second book collection is maintained.

This first version is online; downloading books for guaranteed offline reading is not included. Read-aloud voice availability and background behavior remain dependent on the device/browser. Existing browser bookmarks are not automatically migrated if installation creates a separate browser storage context.

For a future deployment on another domain, copy the same files to that website directory; the manifest uses relative URLs. Each origin has its own installation and bookmark storage.

## Validation completed

- The source files were downloaded from the latest main at the immutable commit above. Removing the installation blocks from both old and new catalogues gives identical content; all existing catalogue content and book links remain unchanged.
- JavaScript syntax, manifest fields, local asset references and all three PNG sizes pass checks.
- Chromium parses the manifest without errors and reports no installation eligibility errors. Directory and root deployment paths both resolve correctly.
- The installation panel fits at 320, 360, 412 and 1280 CSS pixels, with a button at least 44 px high. The existing catalogue has 11 px of horizontal overflow at 320 px; this package does not increase it.
- Browser interaction checks cover manual instructions, keyboard focus, accepted/dismissed/unavailable install prompts and installation completion. The native prompt outcomes and Safari/standalone flags are simulated for these checks.
- Existing catalogue dictionary search and an English book navigation link pass with the current shared assets, with no page errors.
- Physical Android/iPhone installation, actual standalone book navigation and voice playback remain to be checked on the published website.

## Updated icon on an installed device

Browsers may retain a previously installed icon. If the old icon remains after publication, remove the installed Dhamma Books app icon and install again from the refreshed catalogue. Do not clear browser/site data merely to change the icon.
