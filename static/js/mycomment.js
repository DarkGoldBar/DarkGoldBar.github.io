const commentTextarea = document.getElementById("comment");
const renderedDiv = document.getElementById("rendered-comment");

function renderMarkdown() {
  const markdown = commentTextarea.value;
  const html = marked(markdown);
  renderedDiv.innerHTML = html;
}

commentTextarea.addEventListener("input", renderMarkdown);
