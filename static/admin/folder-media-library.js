/* Folder media library for Decap CMS. Source: https://github.com/hayward-solutions/decap-cms-media-library-folders (MIT). */
"use strict";
var DecapFolderMediaLibrary = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../../../tmp/tmp.3XQA2OhU6j/decap-cms-media-library-folders-main/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default,
    folderMediaLibrary: () => folderMediaLibrary
  });

  // ../../../../tmp/tmp.3XQA2OhU6j/decap-cms-media-library-folders-main/src/styles.ts
  var STYLES = `
  .dml-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  }

  .dml-overlay[hidden] {
    display: none;
  }

  .dml-modal {
    background: #fff;
    border-radius: 8px;
    width: 90vw;
    max-width: 1100px;
    height: 80vh;
    max-height: 750px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .dml-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
  }

  .dml-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .dml-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: #666;
    flex-wrap: wrap;
  }

  .dml-breadcrumb {
    background: none;
    border: none;
    padding: 4px 6px;
    cursor: pointer;
    color: #3a69c7;
    font-size: 14px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .dml-breadcrumb:hover {
    background: #f0f4ff;
  }

  .dml-breadcrumb-current {
    color: #333;
    cursor: default;
    font-weight: 600;
  }

  .dml-breadcrumb-current:hover {
    background: none;
  }

  .dml-breadcrumb-separator {
    color: #999;
    font-size: 12px;
    user-select: none;
  }

  .dml-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .dml-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .dml-btn:hover {
    background: #f5f5f5;
    border-color: #ccc;
  }

  .dml-btn-primary {
    background: #3a69c7;
    color: #fff;
    border-color: #3a69c7;
  }

  .dml-btn-primary:hover {
    background: #2d54a3;
    border-color: #2d54a3;
  }

  .dml-btn-primary:disabled {
    background: #a0b4d9;
    border-color: #a0b4d9;
    cursor: not-allowed;
  }

  .dml-btn-close {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 18px;
    color: #666;
    border: none;
    background: none;
  }

  .dml-btn-close:hover {
    background: #f0f0f0;
    color: #333;
  }

  .dml-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    gap: 12px;
  }

  .dml-toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dml-search {
    padding: 7px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    width: 220px;
    outline: none;
    transition: border-color 0.15s;
  }

  .dml-search:focus {
    border-color: #3a69c7;
  }

  .dml-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .dml-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .dml-item {
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: #f8f9fa;
    transition: all 0.15s;
    position: relative;
  }

  .dml-item:hover {
    border-color: #d0d8e8;
    background: #f0f4ff;
  }

  .dml-item-selected {
    border-color: #3a69c7;
    background: #f0f4ff;
  }

  .dml-item-thumb {
    width: 100%;
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #eef1f5;
  }

  .dml-item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dml-item-name {
    padding: 8px 10px;
    font-size: 12px;
    color: #444;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  .dml-folder-icon {
    font-size: 42px;
    color: #f0c040;
    line-height: 1;
  }

  .dml-file-icon {
    font-size: 36px;
    color: #8899aa;
    line-height: 1;
  }

  .dml-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid #e8e8e8;
    flex-shrink: 0;
  }

  .dml-footer-info {
    font-size: 13px;
    color: #666;
  }

  .dml-footer-actions {
    display: flex;
    gap: 8px;
  }

  .dml-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #999;
    font-size: 14px;
    text-align: center;
  }

  .dml-empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.4;
  }

  .dml-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #666;
    font-size: 14px;
  }

  .dml-create-folder-input {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dml-create-folder-input input {
    padding: 7px 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    width: 180px;
    outline: none;
  }

  .dml-create-folder-input input:focus {
    border-color: #3a69c7;
  }

  .dml-upload-zone {
    border: 2px dashed #d0d8e8;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    color: #888;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 16px;
  }

  .dml-upload-zone:hover,
  .dml-upload-zone-active {
    border-color: #3a69c7;
    background: #f0f4ff;
    color: #3a69c7;
  }

  .dml-upload-input {
    display: none;
  }

  .dml-checkmark {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #3a69c7;
    color: #fff;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .dml-item-selected .dml-checkmark {
    opacity: 1;
  }
`;

  // ../../../../tmp/tmp.3XQA2OhU6j/decap-cms-media-library-folders-main/src/state.ts
  function createInitialState() {
    return {
      currentPath: "",
      history: [],
      allFiles: [],
      createdFolders: /* @__PURE__ */ new Set()
    };
  }
  function getFolderEntries(state) {
    const { currentPath, allFiles, createdFolders } = state;
    const prefix = currentPath ? `${currentPath}/` : "";
    const folderSet = /* @__PURE__ */ new Set();
    for (const file of allFiles) {
      const relativePath = file.path;
      if (!relativePath.startsWith(prefix)) continue;
      const remainder = relativePath.slice(prefix.length);
      const slashIndex = remainder.indexOf("/");
      if (slashIndex !== -1) {
        folderSet.add(remainder.slice(0, slashIndex));
      }
    }
    for (const folder of createdFolders) {
      if (currentPath === "") {
        const topLevel = folder.includes("/") ? folder.split("/")[0] : folder;
        folderSet.add(topLevel);
      } else if (folder.startsWith(prefix)) {
        const remainder = folder.slice(prefix.length);
        const topLevel = remainder.includes("/") ? remainder.split("/")[0] : remainder;
        folderSet.add(topLevel);
      }
    }
    return Array.from(folderSet).sort((a, b) => a.localeCompare(b)).map((name) => ({
      name,
      path: currentPath ? `${currentPath}/${name}` : name,
      isDirectory: true
    }));
  }
  function getFilesInCurrentFolder(state) {
    const { currentPath, allFiles } = state;
    const prefix = currentPath ? `${currentPath}/` : "";
    return allFiles.filter((file) => {
      const relativePath = file.path;
      if (!relativePath.startsWith(prefix)) return false;
      const remainder = relativePath.slice(prefix.length);
      return !remainder.includes("/");
    });
  }
  function navigateToFolder(state, folderPath) {
    return {
      ...state,
      history: [...state.history, state.currentPath],
      currentPath: folderPath
    };
  }
  function navigateToPath(state, targetPath) {
    const parts = targetPath ? targetPath.split("/") : [];
    const history = [""];
    for (let i = 0; i < parts.length - 1; i++) {
      history.push(parts.slice(0, i + 1).join("/"));
    }
    return {
      ...state,
      history: targetPath === "" ? [] : history,
      currentPath: targetPath
    };
  }
  function createFolder(state, folderName) {
    const sanitized = folderName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!sanitized) return state;
    const fullPath = state.currentPath ? `${state.currentPath}/${sanitized}` : sanitized;
    const newCreatedFolders = new Set(state.createdFolders);
    newCreatedFolders.add(fullPath);
    return {
      ...state,
      createdFolders: newCreatedFolders
    };
  }
  function setFiles(state, files, mediaFolder) {
    const prefix = mediaFolder ? `${mediaFolder}/` : "";
    const processed = files.map((file) => ({
      ...file,
      path: file.path.startsWith(prefix) ? file.path.slice(prefix.length) : file.path
    }));
    return {
      ...state,
      allFiles: processed
    };
  }
  function getBreadcrumbs(state) {
    const crumbs = [{ label: "Media", path: "" }];
    if (!state.currentPath) return crumbs;
    const parts = state.currentPath.split("/");
    for (let i = 0; i < parts.length; i++) {
      crumbs.push({
        label: parts[i],
        path: parts.slice(0, i + 1).join("/")
      });
    }
    return crumbs;
  }

  // ../../../../tmp/tmp.3XQA2OhU6j/decap-cms-media-library-folders-main/src/ui.ts
  var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "svg",
    "webp",
    "avif",
    "bmp",
    "ico"
  ]);
  function isImageFile(name) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return IMAGE_EXTENSIONS.has(ext);
  }
  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function createMediaLibraryUI(config) {
    let state = createInitialState();
    let selectedFiles = [];
    let allowMultiple = true;
    let imagesOnly = false;
    let isLoading = false;
    let searchQuery = "";
    let showCreateFolder = false;
    const overlay = document.createElement("div");
    overlay.className = "dml-overlay";
    overlay.hidden = true;
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    overlay.appendChild(styleEl);
    const modal = document.createElement("div");
    modal.className = "dml-modal";
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) hide();
    });
    document.body.appendChild(overlay);
    function setState(newState) {
      state = newState;
      render();
    }
    function setSelectedFiles(files) {
      selectedFiles = files;
      render();
    }
    async function loadAndSetFiles() {
      isLoading = true;
      render();
      try {
        const files = await config.loadFiles();
        setState(setFiles(state, files, config.mediaFolder));
      } catch (err) {
        console.error("Failed to load media files:", err);
      } finally {
        isLoading = false;
        render();
      }
    }
    function handleFolderClick(folder) {
      selectedFiles = [];
      searchQuery = "";
      setState(navigateToFolder(state, folder.path));
    }
    function handleBreadcrumbClick(path) {
      selectedFiles = [];
      searchQuery = "";
      setState(navigateToPath(state, path));
    }
    function handleFileClick(file) {
      if (allowMultiple) {
        const isSelected = selectedFiles.some((f) => f.path === file.path);
        if (isSelected) {
          setSelectedFiles(selectedFiles.filter((f) => f.path !== file.path));
        } else {
          setSelectedFiles([...selectedFiles, file]);
        }
      } else {
        setSelectedFiles([file]);
      }
    }
    function handleInsertSelected() {
      if (selectedFiles.length === 0) return;
      const paths = selectedFiles.map((file) => {
        const publicBase = config.publicFolder.replace(/\/$/, "");
        return `${publicBase}/${file.path}`;
      });
      config.handleInsert(allowMultiple && paths.length > 1 ? paths : paths[0]);
      hide();
    }
    function handleCreateFolder(name) {
      setState(createFolder(state, name));
      showCreateFolder = false;
      render();
    }
    async function handleFileUpload(files) {
      const currentPath = state.currentPath;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const targetPath = currentPath ? `${config.mediaFolder}/${currentPath}/${file.name}` : `${config.mediaFolder}/${file.name}`;
        try {
          await config.uploadFile(file, targetPath);
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }
      await loadAndSetFiles();
    }
    async function handleDeleteSelected() {
      if (selectedFiles.length === 0) return;
      const fileNames = selectedFiles.map((f) => f.name).join(", ");
      if (!window.confirm(`Delete ${selectedFiles.length} file(s)?
${fileNames}`)) return;
      for (const file of selectedFiles) {
        try {
          const fullPath = config.mediaFolder ? `${config.mediaFolder}/${file.path}` : file.path;
          await config.deleteFile({ ...file, path: fullPath });
        } catch (err) {
          console.error(`Failed to delete ${file.name}:`, err);
        }
      }
      selectedFiles = [];
      await loadAndSetFiles();
    }
    function getFilteredEntries() {
      let folders = getFolderEntries(state);
      let files = getFilesInCurrentFolder(state);
      if (imagesOnly) {
        files = files.filter((f) => isImageFile(f.name));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        folders = folders.filter((f) => f.name.toLowerCase().includes(q));
        files = files.filter((f) => f.name.toLowerCase().includes(q));
      }
      return { folders, files };
    }
    function render() {
      const breadcrumbs = getBreadcrumbs(state);
      const { folders, files } = getFilteredEntries();
      modal.innerHTML = "";
      const header = el("div", "dml-header");
      const headerLeft = el("div", "dml-header-left");
      const breadcrumbsEl = el("div", "dml-breadcrumbs");
      breadcrumbs.forEach((crumb, i) => {
        if (i > 0) {
          const sep = el("span", "dml-breadcrumb-separator");
          sep.textContent = "/";
          breadcrumbsEl.appendChild(sep);
        }
        const isLast = i === breadcrumbs.length - 1;
        const btn = el("button", `dml-breadcrumb${isLast ? " dml-breadcrumb-current" : ""}`);
        btn.textContent = crumb.label;
        if (!isLast) {
          btn.addEventListener("click", () => handleBreadcrumbClick(crumb.path));
        }
        breadcrumbsEl.appendChild(btn);
      });
      headerLeft.appendChild(breadcrumbsEl);
      header.appendChild(headerLeft);
      const headerActions = el("div", "dml-header-actions");
      const closeBtn = el("button", "dml-btn dml-btn-close");
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", hide);
      headerActions.appendChild(closeBtn);
      header.appendChild(headerActions);
      modal.appendChild(header);
      const toolbar = el("div", "dml-toolbar");
      const toolbarLeft = el("div", "dml-toolbar-left");
      if (showCreateFolder) {
        const inputWrap = el("div", "dml-create-folder-input");
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Folder name...";
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && input.value.trim()) {
            handleCreateFolder(input.value);
          } else if (e.key === "Escape") {
            showCreateFolder = false;
            render();
          }
        });
        const confirmBtn = el("button", "dml-btn dml-btn-primary");
        confirmBtn.textContent = "Create";
        confirmBtn.addEventListener("click", () => {
          if (input.value.trim()) handleCreateFolder(input.value);
        });
        const cancelBtn2 = el("button", "dml-btn");
        cancelBtn2.textContent = "Cancel";
        cancelBtn2.addEventListener("click", () => {
          showCreateFolder = false;
          render();
        });
        inputWrap.appendChild(input);
        inputWrap.appendChild(confirmBtn);
        inputWrap.appendChild(cancelBtn2);
        toolbarLeft.appendChild(inputWrap);
        requestAnimationFrame(() => input.focus());
      } else {
        const newFolderBtn = el("button", "dml-btn");
        newFolderBtn.textContent = "+ New Folder";
        newFolderBtn.addEventListener("click", () => {
          showCreateFolder = true;
          render();
        });
        toolbarLeft.appendChild(newFolderBtn);
        const uploadBtn = el("button", "dml-btn");
        uploadBtn.textContent = "Upload";
        uploadBtn.addEventListener("click", () => {
          fileInput.click();
        });
        toolbarLeft.appendChild(uploadBtn);
        if (selectedFiles.length > 0) {
          const deleteBtn = el("button", "dml-btn");
          deleteBtn.textContent = `Delete (${selectedFiles.length})`;
          deleteBtn.style.color = "#cc3333";
          deleteBtn.addEventListener("click", handleDeleteSelected);
          toolbarLeft.appendChild(deleteBtn);
        }
      }
      toolbar.appendChild(toolbarLeft);
      const searchInput = document.createElement("input");
      searchInput.className = "dml-search";
      searchInput.type = "text";
      searchInput.placeholder = "Search files...";
      searchInput.value = searchQuery;
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value;
        render();
        searchInput.focus();
      });
      toolbar.appendChild(searchInput);
      modal.appendChild(toolbar);
      const content = el("div", "dml-content");
      const dropZone = el("div", "dml-upload-zone");
      dropZone.textContent = 'Drop files here to upload, or click "Upload" above';
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dml-upload-zone-active");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dml-upload-zone-active");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dml-upload-zone-active");
        if (e.dataTransfer?.files.length) {
          handleFileUpload(e.dataTransfer.files);
        }
      });
      dropZone.addEventListener("click", () => fileInput.click());
      content.appendChild(dropZone);
      if (isLoading) {
        const loading = el("div", "dml-loading");
        loading.textContent = "Loading media...";
        content.appendChild(loading);
      } else if (folders.length === 0 && files.length === 0) {
        const empty = el("div", "dml-empty");
        const emptyIcon = el("div", "dml-empty-icon");
        emptyIcon.textContent = "\u{1F4C2}";
        empty.appendChild(emptyIcon);
        const emptyText = el("div", "");
        emptyText.textContent = searchQuery ? "No files or folders match your search." : "This folder is empty. Upload files or create a subfolder.";
        empty.appendChild(emptyText);
        content.appendChild(empty);
      } else {
        const grid = el("div", "dml-grid");
        for (const folder of folders) {
          const item = el("div", "dml-item");
          item.addEventListener("dblclick", () => handleFolderClick(folder));
          const thumb = el("div", "dml-item-thumb");
          const icon = el("div", "dml-folder-icon");
          icon.textContent = "\u{1F4C1}";
          thumb.appendChild(icon);
          item.appendChild(thumb);
          const name = el("div", "dml-item-name");
          name.textContent = folder.name;
          name.title = folder.name;
          item.appendChild(name);
          grid.appendChild(item);
        }
        for (const file of files) {
          const isSelected = selectedFiles.some((f) => f.path === file.path);
          const item = el("div", `dml-item${isSelected ? " dml-item-selected" : ""}`);
          item.addEventListener("click", () => handleFileClick(file));
          item.addEventListener("dblclick", () => {
            setSelectedFiles([file]);
            handleInsertSelected();
          });
          const thumb = el("div", "dml-item-thumb");
          if (isImageFile(file.name) && (file.url || file.displayURL)) {
            const img = document.createElement("img");
            const displayUrl = typeof file.displayURL === "string" ? file.displayURL : file.url ?? "";
            img.src = displayUrl;
            img.alt = file.name;
            img.loading = "lazy";
            thumb.appendChild(img);
          } else {
            const icon = el("div", "dml-file-icon");
            icon.textContent = "\u{1F4C4}";
            thumb.appendChild(icon);
          }
          item.appendChild(thumb);
          const checkmark = el("div", "dml-checkmark");
          checkmark.textContent = "\u2713";
          item.appendChild(checkmark);
          const nameEl = el("div", "dml-item-name");
          const sizeStr = formatFileSize(file.size);
          nameEl.textContent = sizeStr ? `${file.name} (${sizeStr})` : file.name;
          nameEl.title = file.path;
          item.appendChild(nameEl);
          grid.appendChild(item);
        }
        content.appendChild(grid);
      }
      modal.appendChild(content);
      const footer = el("div", "dml-footer");
      const footerInfo = el("div", "dml-footer-info");
      const totalFiles = files.length;
      const totalFolders = folders.length;
      const parts = [];
      if (totalFolders > 0) parts.push(`${totalFolders} folder${totalFolders !== 1 ? "s" : ""}`);
      if (totalFiles > 0) parts.push(`${totalFiles} file${totalFiles !== 1 ? "s" : ""}`);
      if (selectedFiles.length > 0) parts.push(`${selectedFiles.length} selected`);
      footerInfo.textContent = parts.join(" \xB7 ") || "Empty folder";
      footer.appendChild(footerInfo);
      const footerActions = el("div", "dml-footer-actions");
      const cancelBtn = el("button", "dml-btn");
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", hide);
      footerActions.appendChild(cancelBtn);
      const insertBtn = document.createElement("button");
      insertBtn.className = "dml-btn dml-btn-primary";
      insertBtn.textContent = selectedFiles.length > 1 ? `Insert ${selectedFiles.length} files` : "Insert";
      insertBtn.disabled = selectedFiles.length === 0;
      insertBtn.addEventListener("click", handleInsertSelected);
      footerActions.appendChild(insertBtn);
      footer.appendChild(footerActions);
      modal.appendChild(footer);
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "dml-upload-input";
    fileInput.multiple = true;
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.length) {
        handleFileUpload(fileInput.files);
        fileInput.value = "";
      }
    });
    document.body.appendChild(fileInput);
    function show(options) {
      allowMultiple = options?.allowMultiple !== false;
      imagesOnly = options?.imagesOnly ?? false;
      selectedFiles = [];
      searchQuery = "";
      showCreateFolder = false;
      overlay.hidden = false;
      loadAndSetFiles();
    }
    function hide() {
      overlay.hidden = true;
    }
    function destroy() {
      overlay.remove();
      fileInput.remove();
    }
    return { show, hide, destroy };
  }
  function el(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }

  // ../../../../tmp/tmp.3XQA2OhU6j/decap-cms-media-library-folders-main/src/index.ts
  function resolveConfig() {
    const w = window;
    let mediaFolder = "images";
    let publicFolder = "/images";
    try {
      const store = w.CMS_STORE ?? w.__store;
      if (store) {
        const stateConfig = store.getState()?.config;
        if (stateConfig?.media_folder) mediaFolder = stateConfig.media_folder;
        if (stateConfig?.public_folder) publicFolder = stateConfig.public_folder;
      }
    } catch {
    }
    return {
      mediaFolder: mediaFolder.replace(/^\/|\/$/g, ""),
      publicFolder: publicFolder.replace(/\/$/, "")
    };
  }
  function getBackend() {
    try {
      const w = window;
      const store = w.CMS_STORE ?? w.__store;
      if (!store) return null;
      const state = store.getState();
      const backend = state?.backend;
      return backend ?? null;
    } catch {
      return null;
    }
  }
  async function loadFiles(mediaFolder) {
    const backend = getBackend();
    if (!backend?.getMedia) {
      console.warn("[decap-media-library] Backend not available, using empty file list");
      return [];
    }
    try {
      const files = await backend.getMedia(mediaFolder);
      return files;
    } catch (err) {
      console.error("[decap-media-library] Failed to load media:", err);
      return [];
    }
  }
  async function uploadFile(file, _path, mediaFolder) {
    const backend = getBackend();
    if (!backend?.persistMedia) {
      throw new Error("Backend not available for upload");
    }
    const result = await backend.persistMedia(
      { file, path: _path },
      { commitMessage: `Upload ${file.name} to ${mediaFolder}` }
    );
    return result;
  }
  async function deleteFile(file) {
    const backend = getBackend();
    if (!backend?.deleteMedia) {
      throw new Error("Backend not available for delete");
    }
    await backend.deleteMedia(file.path, {
      commitMessage: `Delete ${file.name}`
    });
  }
  async function init({ handleInsert }) {
    const { mediaFolder, publicFolder } = resolveConfig();
    const ui = createMediaLibraryUI({
      mediaFolder,
      publicFolder,
      handleInsert,
      loadFiles: () => loadFiles(mediaFolder),
      uploadFile: (file, path) => uploadFile(file, path, mediaFolder),
      deleteFile
    });
    return {
      show: ui.show,
      hide: ui.hide,
      onClearControl: () => {
      },
      onRemoveControl: () => {
      },
      enableStandalone: () => true
    };
  }
  var folderMediaLibrary = {
    name: "folder-media-library",
    init
  };
  var index_default = folderMediaLibrary;
  return __toCommonJS(index_exports);
})();

