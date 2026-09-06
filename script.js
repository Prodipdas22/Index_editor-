const STORAGE_KEY = "index-editor-v2-sprint2";

const defaultExperiment = () => ({
  id: uid(),

  number: "01",

  title: "Create a simple HTML document",

  objective:
    "To create a basic HTML document using heading, paragraph and other HTML elements.",

  result:
    "The HTML document was created and displayed successfully.",

  code: {

    html:
`<h1>Hello, World!</h1>
<p>This is my first HTML experiment.</p>`,

    css:
`body {
  font-family: Arial, sans-serif;
  padding: 30px;
}

h1 {
  color: #2563eb;
}`,

    js:
`console.log("Experiment 01 loaded successfully");`
  }
});


let state = {

  experiments: [
    defaultExperiment()
  ],

  activeId: null,

  language: "html",

  theme: "dark",

  previewMode: "desktop"
};


let outputCaptures = new Map();


const $ = id =>
  document.getElementById(id);


const qs = selector =>
  document.querySelector(selector);


const qsa = selector =>
  [...document.querySelectorAll(selector)];


/* =========================================================
   ID
   ========================================================= */

function uid() {

  return (
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) +
        Math.random()
          .toString(36)
          .slice(2)
  );

}


/* =========================================================
   ACTIVE EXPERIMENT
   ========================================================= */

function activeExperiment() {

  return (
    state.experiments.find(
      e => e.id === state.activeId
    ) ||
    state.experiments[0]
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value = "") {

  return String(value).replace(
    /[&<>"']/g,

    character => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[character])
  );

}


/* =========================================================
   SAVE
   ========================================================= */

function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

  $("saveStatus").textContent =
    "● Saved";

  $("saveStatus").style.color =
    "var(--success)";
}


/* =========================================================
   LOAD
   ========================================================= */

function loadState() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        )
      );

    if (
      saved &&
      saved.experiments &&
      saved.experiments.length
    ) {

      state = {
        ...state,
        ...saved
      };

    }

  } catch (error) {

    console.warn(
      "Could not load saved project:",
      error
    );

  }


  state.activeId =
    state.activeId ||
    state.experiments[0].id;


  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

}


/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(fn, ms) {

  let timer;

  return (...args) => {

    clearTimeout(timer);

    timer =
      setTimeout(
        () => fn(...args),
        ms
      );

  };

}


const autoSave =
  debounce(
    () => saveState(),
    500
  );


/* =========================================================
   EXPERIMENT LIST
   ========================================================= */

function renderExperimentList() {

  const query =
    $("experimentSearch")
      .value
      .toLowerCase()
      .trim();


  const list =
    $("experimentList");


  list.innerHTML = "";


  state.experiments

    .filter(
      e =>
        `${e.number} ${e.title}`
          .toLowerCase()
          .includes(query)
    )

    .forEach(e => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "experiment-item" +
        (
          e.id === state.activeId
            ? " active"
            : ""
        );


      item.innerHTML = `

        <div class="num">
          EXP ${escapeHtml(
            e.number || "--"
          )}
        </div>

        <div class="name">
          ${escapeHtml(
            e.title ||
            "Untitled experiment"
          )}
        </div>

      `;


      item.onclick = () => {

        state.activeId = e.id;

        renderAll();

        closeMobileSidebar();

      };


      list.appendChild(item);

    });


  $("experimentCount").textContent =
    `${state.experiments.length} experiment` +
    (
      state.experiments.length !== 1
        ? "s"
        : ""
    );

}


/* =========================================================
   FIELDS
   ========================================================= */

function renderFields() {

  const e =
    activeExperiment();


  $("expNumber").value =
    e.number || "";


  $("expTitle").value =
    e.title || "";


  $("expObjective").value =
    e.objective || "";


  $("expResult").value =
    e.result || "";


  $("codeEditor").value =
    e.code[state.language] || "";


  $("languageLabel").textContent =
    state.language === "js"
      ? "JAVASCRIPT"
      : state.language.toUpperCase();


  updateLineNumbers();

  updateCursorInfo();

}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

  renderExperimentList();

  renderFields();

  renderPreview();

}


/* =========================================================
   UPDATE EXPERIMENT FIELD
   ========================================================= */

function updateExperimentField(
  key,
  value
) {

  activeExperiment()[key] =
    value;


  $("saveStatus").textContent =
    "● Unsaved";


  $("saveStatus").style.color =
    "#f59e0b";


  autoSave();

  renderExperimentList();

}


/* =========================================================
   ADD EXPERIMENT
   ========================================================= */

function addExperiment() {

  const next =
    state.experiments.length + 1;


  const number =
    String(next).padStart(
      2,
      "0"
    );


  const experiment = {

    id: uid(),

    number,

    title:
      `Experiment ${number}`,

    objective: "",

    result: "",

    code: {

      html:
        "<h1>New Experiment</h1>",

      css: "",

      js: ""

    }

  };


  state.experiments.push(
    experiment
  );


  state.activeId =
    experiment.id;


  saveState();

  renderAll();

}


/* =========================================================
   DUPLICATE
   ========================================================= */

function duplicateExperiment() {

  const source =
    activeExperiment();


  const copy =
    JSON.parse(
      JSON.stringify(source)
    );


  copy.id =
    uid();


  copy.number =
    String(
      state.experiments.length + 1
    ).padStart(2, "0");


  copy.title =
    (source.title || "Experiment") +
    " (Copy)";


  state.experiments.push(
    copy
  );


  state.activeId =
    copy.id;


  saveState();

  renderAll();

}


/* =========================================================
   DELETE
   ========================================================= */

function deleteExperiment() {

  if (
    state.experiments.length === 1
  ) {

    alert(
      "At least one experiment must remain."
    );

    return;

  }


  const experiment =
    activeExperiment();


  if (
    !confirm(
      `Delete Experiment ${experiment.number}?`
    )
  ) {

    return;

  }


  state.experiments =
    state.experiments.filter(
      e => e.id !== experiment.id
    );


  state.activeId =
    state.experiments[0].id;


  saveState();

  renderAll();

}


/* =========================================================
   LANGUAGE
   ========================================================= */

function switchLanguage(lang) {

  state.language =
    lang;


  qsa(".tab")
    .forEach(
      tab =>
        tab.classList.toggle(
          "active",
          tab.dataset.lang === lang
        )
    );


  renderFields();

}


/* =========================================================
   LINE NUMBERS
   ========================================================= */

function updateLineNumbers() {

  const value =
    $("codeEditor").value;


  const lines =
    value.split("\n").length;


  $("lineNumbers").textContent =
    Array.from(
      {length: lines},
      (_, index) =>
        index + 1
    ).join("\n");


  $("lineNumbers").scrollTop =
    $("codeEditor").scrollTop;

}


/* =========================================================
   BUILD DOCUMENT
   ========================================================= */

function buildDocument(e) {

  return `<!doctype html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<style>

${e.code.css || ""}

</style>

</head>

<body>

${e.code.html || ""}

<script>

window.addEventListener(
  "error",
  function(ev) {

    parent.postMessage(
      {
        type:"console",
        level:"error",
        message:
          ev.message +
          " (line " +
          ev.lineno +
          ")"
      },
      "*"
    );

  }
);


const originalLog =
  console.log;

const originalWarn =
  console.warn;

const originalError =
  console.error;


function send(
  level,
  args
) {

  parent.postMessage(
    {
      type:"console",

      level,

      message:
        args
          .map(
            value => {

              try {

                return typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);

              } catch {

                return String(value);

              }

            }
          )
          .join(" ")
    },

    "*"
  );

}


console.log =
  (...args) => {

    send(
      "log",
      args
    );

    originalLog(...args);

  };


console.warn =
  (...args) => {

    send(
      "warn",
      args
    );

    originalWarn(...args);

  };


console.error =
  (...args) => {

    send(
      "error",
      args
    );

    originalError(...args);

  };


try {

${e.code.js || ""}

} catch(error) {

  send(
    "error",
    [
      error.stack ||
      error.message
    ]
  );

}

<\/script>

</body>

</html>`;

}


/* =========================================================
   CONSOLE
   ========================================================= */

function clearConsole() {

  $("consoleOutput").innerHTML =
    `<div class="console-line muted">
      Console cleared.
    </div>`;


  $("consoleStatus").textContent =
    "Ready";

}


/* =========================================================
   ADD CONSOLE
   ========================================================= */

function addConsole(
  level,
  message
) {

  const line =
    document.createElement(
      "div"
    );


  line.className =
    `console-line ${level}`;


  line.textContent =
    `[${level}] ${message}`;


  $("consoleOutput")
    .appendChild(line);


  $("consoleOutput").scrollTop =
    $("consoleOutput").scrollHeight;


  $("consoleStatus").textContent =
    level === "error"
      ? "Runtime error"
      : "Output received";

}


/* =========================================================
   RUN
   ========================================================= */

function runCode() {

  const e =
    activeExperiment();


  clearConsole();


  addConsole(
    "muted",
    `Running Experiment ${e.number}...`
  );


  $("previewFrame").srcdoc =
    buildDocument(e);


  setTimeout(
    () =>
      addConsole(
        "log",
        "Preview rendered."
      ),
    250
  );

}


/* =========================================================
   PREVIEW
   ========================================================= */

function renderPreview() {

  const e =
    activeExperiment();


  $("previewFrame").srcdoc =
    buildDocument(e);


  $("previewStage")
    .classList.toggle(
      "mobile-preview",
      state.previewMode === "mobile"
    );


  $("previewDesktopBtn")
    .classList.toggle(
      "active",
      state.previewMode === "desktop"
    );


  $("previewMobileBtn")
    .classList.toggle(
      "active",
      state.previewMode === "mobile"
    );

}


/* =========================================================
   CODE UPDATE
   ========================================================= */

function updateCode(value) {

  activeExperiment()
    .code[state.language] =
    value;


  $("saveStatus").textContent =
    "● Unsaved";


  $("saveStatus").style.color =
    "#f59e0b";


  updateLineNumbers();

  updateCursorInfo();

  autoSave();

  renderExperimentList();

  debouncePreview();

}


const debouncePreview =
  debounce(
    renderPreview,
    450
  );


/* =========================================================
   DOWNLOAD HTML
   ========================================================= */

function downloadCurrentHTML() {

  const e =
    activeExperiment();


  const blob =
    new Blob(
      [
        buildDocument(e)
      ],
      {
        type:"text/html"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      "a"
    );


  a.href = url;


  a.download =
    `experiment-${e.number || "01"}.html`;


  document.body.appendChild(a);

  a.click();

  a.remove();


  URL.revokeObjectURL(url);

}


/* =========================================================
   COPY
   ========================================================= */

async function copyCurrentCode() {

  try {

    await navigator.clipboard
      .writeText(
        $("codeEditor").value
      );


    $("copyCodeBtn").textContent =
      "Copied";


    setTimeout(
      () =>
        $("copyCodeBtn").textContent =
          "Copy",
      1000
    );


  } catch {

    alert(
      "Clipboard access is unavailable. Select and copy the code manually."
    );

  }

}


/* =========================================================
   FORMAT
   ========================================================= */

function formatCode() {

  const area =
    $("codeEditor");


  let value =
    area.value;


  if (
    state.language === "html"
  ) {

    value =
      value
        .replace(
          />\s*</g,
          ">\n<"
        )
        .replace(
          /\n{3,}/g,
          "\n\n"
        );

  }


  else if (
    state.language === "css"
  ) {

    value =
      value
        .replace(
          /\s*{\s*/g,
          " {\n  "
        )
        .replace(
          /;\s*/g,
          ";\n  "
        )
        .replace(
          /\s*}\s*/g,
          "\n}\n"
        )
        .replace(
          /\n\s*\n/g,
          "\n"
        );

  }


  else {

    value =
      value
        .replace(
          /;\s*/g,
          ";\n"
        )
        .replace(
          /{\s*/g,
          "{\n  "
        )
        .replace(
          /}\s*/g,
          "\n}\n"
        );

  }


  area.value =
    value.trim();


  updateCode(
    area.value
  );

}


/* =========================================================
   OUTPUT CAPTURE
   ========================================================= */

async function captureExperimentOutput(
  e
) {

  return new Promise(
    resolve => {

      if (
        typeof html2canvas ===
        "undefined"
      ) {

        resolve(null);

        return;

      }


      const iframe =
        document.createElement(
          "iframe"
        );


      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
      );


      iframe.style.cssText =
        `
        position:fixed;
        left:-10000px;
        top:0;
        width:850px;
        height:520px;
        border:0;
        background:white;
        visibility:hidden;
        `;


      document.body.appendChild(
        iframe
      );


      let finished =
        false;


      const finish =
        value => {

          if (finished)
            return;


          finished =
            true;


          iframe.remove();


          resolve(value);

        };


      iframe.onload =
        () => {

          setTimeout(
            async () => {

              try {

                const doc =
                  iframe.contentDocument;


                if (
                  !doc ||
                  !doc.body
                ) {

                  return finish(
                    null
                  );

                }


                const canvas =
                  await html2canvas(
                    doc.body,
                    {

                      backgroundColor:
                        "#ffffff",

                      scale:
                        Math.min(
                          window.devicePixelRatio ||
                            1,
                          1.5
                        ),

                      useCORS:true,

                      allowTaint:false,

                      logging:false,

                      windowWidth:850,

                      windowHeight:520

                    }
                  );


                finish(
                  canvas.toDataURL(
                    "image/png",
                    0.92
                  )
                );


              } catch(error) {

                console.warn(
                  "Output capture failed:",
                  error
                );


                finish(null);

              }

            },
            500
          );

        };


      iframe.srcdoc =
        buildDocument(e);


      setTimeout(
        () =>
          finish(null),
        8000
      );

    }
  );

}


/* =========================================================
   CHECK CODE EXISTS
   ========================================================= */

function hasCode(code) {

  return (
    typeof code === "string" &&
    code.trim().length > 0
  );

}


/* =========================================================
   CODE WINDOW
   ========================================================= */

function codeWindow(
  label,
  code,
  extraClass = ""
) {

  /*
     Empty CSS / JavaScript
     sections are NOT rendered.
  */

  if (
    !hasCode(code)
  ) {

    return "";

  }


  return `

    <div
      class="code-window ${extraClass}"
    >

      <div
        class="code-window-head"
      >

        <i class="code-dot"></i>

        <i class="code-dot"></i>

        <i class="code-dot"></i>

        <span class="code-label">
          ${label}
        </span>

      </div>


      <pre
        class="code-block"
      >${escapeHtml(code)}</pre>

    </div>

  `;

}


/* =========================================================
   SOURCE CODE SECTION
   ========================================================= */

function sourceCodeSection(e) {

  const html =
    codeWindow(
      "HTML",
      e.code?.html || "",
      "html-code"
    );


  const css =
    codeWindow(
      "CSS",
      e.code?.css || "",
      "small-code"
    );


  const js =
    codeWindow(
      "JAVASCRIPT",
      e.code?.js || "",
      "small-code"
    );


  if (
    !html &&
    !css &&
    !js
  ) {

    return `

      <div class="output-fallback">

        No source code has been entered.

      </div>

    `;

  }


  return `

    <div class="source-code-grid">

      ${html}

      ${css}

      ${js}

    </div>

  `;

}


/* =========================================================
   REPORT PAGE
   ========================================================= */

function reportPage(
  e,
  capture
) {

  const html =
    e.code?.html || "";


  const css =
    e.code?.css || "";


  const js =
    e.code?.js || "";


  const codeLength =
    html.length +
    css.length +
    js.length;


  const compact =
    codeLength > 2600
      ? " compact"
      : "";


  const output =
    capture

      ? `

        <img
          class="output-image"
          src="${capture}"
          alt="Rendered experiment output"
        >

      `

      : `

        <div
          class="output-fallback"
        >

          Output screenshot
          could not be captured.

          <br>

          Run the experiment
          in Live Preview and
          try Export / PDF again.

        </div>

      `;


  return `

    <article
      class="a4-page${compact}"
    >


      <!-- HEADER -->

      <header
        class="report-header"
      >

        <div
          class="report-title"
        >

          Experiment
          ${escapeHtml(
            e.number || "--"
          )}

          :

          ${escapeHtml(
            e.title ||
            "Untitled Experiment"
          )}

        </div>

      </header>


      <!-- OBJECTIVE -->

      <section
        class="report-section"
      >

        <h3>
          1. OBJECTIVE
        </h3>


        <div
          class="objective-text"
        >

          ${escapeHtml(
            e.objective ||
            "Objective not provided."
          )}

        </div>

      </section>


      <!-- SOURCE CODE -->

      <section
        class="report-section"
      >

        <h3>
          2. SOURCE CODE
        </h3>


        ${sourceCodeSection(e)}

      </section>


      <!-- OUTPUT -->

      <section
        class="report-section"
      >

        <h3>
          3. OUTPUT
        </h3>


        <div
          class="output-box"
        >

          <div
            class="output-head"
          >

            Rendered browser output

          </div>


          ${output}

        </div>

      </section>


    </article>

  `;

}


/* =========================================================
   BUILD REPORT
   ========================================================= */

async function buildReport() {

  $("reportPages").innerHTML = `

    <div
      class="a4-page report-loading"
    >

      Preparing report...

      <br>

      <small>
        Capturing experiment outputs
      </small>

    </div>

  `;


  outputCaptures.clear();


  const pages = [];


  for (
    const e
    of state.experiments
  ) {

    const capture =
      await captureExperimentOutput(
        e
      );


    outputCaptures.set(
      e.id,
      capture
    );


    pages.push(
      reportPage(
        e,
        capture
      )
    );

  }


  $("reportPages").innerHTML =
    pages.join("");


  createPrintReport();

}


/* =========================================================
   OPEN REPORT
   ========================================================= */

function openReport() {

  saveState();


  $("reportModal")
    .classList
    .remove("hidden");


  buildReport();

}


/* =========================================================
   CLOSE REPORT
   ========================================================= */

function closeReport() {

  $("reportModal")
    .classList
    .add("hidden");

}


/* =========================================================
   PRINT REPORT
   ========================================================= */

function createPrintReport() {

  const printArea =
    $("reportPrintArea");


  if (!printArea)
    return;


  printArea.innerHTML =
    state.experiments
      .map(e => {

        const capture =
          outputCaptures.get(
            e.id
          );


        const output =
          capture

            ? `

              <img
                class="output-image"
                src="${capture}"
                alt="Rendered experiment output"
              >

            `

            : `

              <div
                class="output-fallback"
              >

                Output screenshot unavailable.

              </div>

            `;


        const html =
          e.code?.html || "";


        const css =
          e.code?.css || "";


        const js =
          e.code?.js || "";


        const codeLength =
          html.length +
          css.length +
          js.length;


        const compact =
          codeLength > 2600
            ? " compact"
            : "";


        return `

          <article
            class="print-report-page${compact}"
          >


            <header
              class="report-header"
            >

              <div
                class="report-title"
              >

                Experiment
                ${escapeHtml(
                  e.number || "--"
                )}

                :

                ${escapeHtml(
                  e.title ||
                  "Untitled Experiment"
                )}

              </div>

            </header>


            <section
              class="report-section"
            >

              <h3>
                1. OBJECTIVE
              </h3>


              <div
                class="objective-text"
              >

                ${escapeHtml(
                  e.objective ||
                  "Objective not provided."
                )}

              </div>

            </section>


            <section
              class="report-section"
            >

              <h3>
                2. SOURCE CODE
              </h3>


              ${sourceCodeSection(e)}

            </section>


            <section
              class="report-section"
            >

              <h3>
                3. OUTPUT
              </h3>


              <div
                class="output-box"
              >

                <div
                  class="output-head"
                >

                  Rendered browser output

                </div>


                ${output}

              </div>

            </section>


          </article>

        `;

      })
      .join("");


}
/* =========================================================
   PRINT / SAVE PDF
   ========================================================= */

function printReport() {

  createPrintReport();


  setTimeout(
    () => {

      window.print();

    },
    150
  );

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";


  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );


  $("themeBtn").textContent =
    state.theme === "dark"
      ? "☾"
      : "☀";


  saveState();

}


/* =========================================================
   FULLSCREEN
   ========================================================= */

function fullscreenPreview() {

  const frame =
    $("previewFrame");


  if (
    frame.requestFullscreen
  ) {

    frame.requestFullscreen();

  }

}


/* =========================================================
   MOBILE NAV
   ========================================================= */

function mobileNav(action) {

  qsa(".mobile-nav button")
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.mobile === action
        )
    );


  if (
    action === "files"
  ) {

    $("sidebar")
      .classList
      .add("open");

  } else {

    $("sidebar")
      .classList
      .remove("open");

  }


  const editor =
    qs(".editor-panel");


  const preview =
    qs(".preview-panel");


  const consolePanel =
    qs(".console-panel");


  if (
    window.innerWidth <= 900
  ) {

    editor.style.display =
      action === "code"
        ? ""
        : "none";


    preview.style.display =
      action === "preview"
        ? ""
        : "none";


    consolePanel.style.display =
      action === "console"
        ? ""
        : "none";


    if (
      action === "files"
    ) {

      editor.style.display =
        "";

      preview.style.display =
        "none";

      consolePanel.style.display =
        "none";

    }

  }

}
/* =========================================================
   CLOSE MOBILE SIDEBAR
   ========================================================= */

function closeMobileSidebar() {

  $("sidebar")
    .classList
    .remove("open");

}


/* =========================================================
   EXPORT PROJECT JSON
   ========================================================= */

function exportProject() {

  saveState();


  const payload = {

    app:
      "Index Editor V2",

    version:
      "Sprint 4",

    exportedAt:
      new Date().toISOString(),

    experiments:
      state.experiments

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      "a"
    );


  a.href = url;


  a.download =
    "index-editor-project.json";


  document.body.appendChild(a);

  a.click();

  a.remove();


  URL.revokeObjectURL(url);

}

/* =========================================================
   IMPORT PROJECT
   ========================================================= */

function importProjectFile(
  file
) {

  if (!file)
    return;


  const reader =
    new FileReader();


  reader.onload =
    () => {

      try {

        const data =
          JSON.parse(
            reader.result
          );


        const experiments =
          Array.isArray(data)
            ? data
            : data.experiments;


        if (
          !Array.isArray(
            experiments
          ) ||
          !experiments.length
        ) {

          throw new Error(
            "No experiments found"
          );

        }


        const cleaned =
          experiments.map(
            (e, index) => ({

              id:
                e.id ||
                uid(),

              number:
                String(
                  e.number ??
                  String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )
                ),

              title:
                String(
                  e.title ??
                  `Experiment ${
                    index + 1
                  }`
                ),

              objective:
                String(
                  e.objective ??
                  ""
                ),

              result:
                String(
                  e.result ??
                  ""
                ),

              code: {

                html:
                  String(
                    e.code?.html ??
                    ""
                  ),

                css:
                  String(
                    e.code?.css ??
                    ""
                  ),

                js:
                  String(
                    e.code?.js ??
                    ""
                  )

              }

            })
          );


        state.experiments =
          cleaned;


        state.activeId =
          cleaned[0].id;


        saveState();

        renderAll();


        alert(
          `Imported ${
            cleaned.length
          } experiment${
            cleaned.length === 1
              ? ""
              : "s"
          } successfully.`
        );


      } catch(error) {

        alert(
          "Invalid project JSON: " +
          error.message
        );

      }

    };


  reader.readAsText(
    file
  );

}
/* =========================================================
   CURSOR INFO
   ========================================================= */

function updateCursorInfo() {

  const area =
    $("codeEditor");


  const position =
    area.selectionStart;


  const before =
    area.value.slice(
      0,
      position
    );


  const line =
    before.split("\n").length;


  const lastBreak =
    before.lastIndexOf("\n");


  const column =
    position -
    lastBreak;


  $("cursorInfo").textContent =
    `Ln ${line}, Col ${column}`;

}
/* =========================================================
   FIND BAR
   ========================================================= */

function openFindBar() {

  $("findBar")
    .classList
    .remove("hidden");


  $("findInput")
    .focus();

}


/* =========================================================
   CLOSE FIND
   ========================================================= */

function closeFindBar() {

  $("findBar")
    .classList
    .add("hidden");

}


/* =========================================================
   FIND TEXT
   ========================================================= */

function findText(
  direction = 1
) {

  const area =
    $("codeEditor");


  const query =
    $("findInput").value;


  if (!query)
    return;


  const text =
    area.value.toLowerCase();


  const search =
    query.toLowerCase();


  let start =
    direction > 0
      ? area.selectionEnd
      : area.selectionStart - 1;


  let index =
    direction > 0

      ? text.indexOf(
          search,
          start
        )

      : text.lastIndexOf(
          search,
          start
        );


  if (
    index === -1
  ) {

    index =
      direction > 0

        ? text.indexOf(
            search
          )

        : text.lastIndexOf(
            search
          );

  }


  if (
    index >= 0
  ) {

    area.focus();


    area.setSelectionRange(
      index,
      index + query.length
    );


    updateCursorInfo();

  }

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function handleEditorShortcuts(
  event
) {

  const mod =
    event.ctrlKey ||
    event.metaKey;


  if (
    mod &&
    event.key.toLowerCase() ===
      "f"
  ) {

    event.preventDefault();

    openFindBar();

  }


  if (
    mod &&
    event.key.toLowerCase() ===
      "s"
  ) {

    event.preventDefault();

    saveState();

  }

}
/* =========================================================
   BIND EVENTS
   ========================================================= */

function bindEvents() {

  $("addExperimentBtn").onclick =
    addExperiment;


  $("duplicateBtn").onclick =
    duplicateExperiment;


  $("deleteBtn").onclick =
    deleteExperiment;


  $("saveBtn").onclick =
    saveState;


  $("exportBtn").onclick =
    exportProject;


  $("importBtn").onclick =
    () =>
      $("projectImport").click();


  $("projectImport").onchange =
    event => {

      importProjectFile(
        event.target.files[0]
      );


      event.target.value =
        "";

    };


  $("downloadBtn").onclick =
    downloadCurrentHTML;


  $("pdfBtn").onclick =
    openReport;


  $("closeReportBtn").onclick =
    closeReport;


  $("refreshReportBtn").onclick =
    buildReport;


  $("printPdfBtn").onclick =
    printReport;


  $("themeBtn").onclick =
    toggleTheme;


  $("runBtn").onclick =
    runCode;


  $("refreshPreviewBtn").onclick =
    renderPreview;


  $("fullscreenBtn").onclick =
    fullscreenPreview;


  $("copyCodeBtn").onclick =
    copyCurrentCode;


  $("formatBtn").onclick =
    formatCode;


  $("findBtn").onclick =
    openFindBar;


  $("wrapBtn").onclick =
    () =>
      $("codeEditor")
        .classList
        .toggle(
          "wrap-on"
        );


  $("closeFindBtn").onclick =
    closeFindBar;


  $("findNextBtn").onclick =
    () =>
      findText(1);


  $("findPrevBtn").onclick =
    () =>
      findText(-1);


  $("findInput").onkeydown =
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        findText(
          event.shiftKey
            ? -1
            : 1
        );

      }


      if (
        event.key ===
        "Escape"
      ) {

        closeFindBar();

      }

    };


  $("clearConsoleBtn").onclick =
    clearConsole;


  $("previewDesktopBtn").onclick =
    () => {

      state.previewMode =
        "desktop";

      renderPreview();

    };


  $("previewMobileBtn").onclick =
    () => {

      state.previewMode =
        "mobile";

      renderPreview();

    };


  $("experimentSearch").oninput =
    renderExperimentList;


  $("codeEditor").oninput =
    event =>
      updateCode(
        event.target.value
      );


  $("codeEditor").onscroll =
    updateLineNumbers;


  $("codeEditor").onkeyup =
    updateCursorInfo;


  $("codeEditor").onclick =
    updateCursorInfo;


  $("codeEditor").onselect =
    updateCursorInfo;


  $("codeEditor")
    .addEventListener(
      "keydown",
      handleEditorShortcuts
    );


  $("codeEditor").onkeydown =
    event => {

      if (
        event.key ===
        "Tab"
      ) {

        event.preventDefault();


        const start =
          event.target.selectionStart;


        const end =
          event.target.selectionEnd;


        event.target.setRangeText(
          "  ",
          start,
          end,
          "end"
        );


        updateCode(
          event.target.value
        );

      }


      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key ===
          "Enter"
      ) {

        event.preventDefault();

        runCode();

      }

    };


  $("expNumber").oninput =
    event =>
      updateExperimentField(
        "number",
        event.target.value
      );


  $("expTitle").oninput =
    event =>
      updateExperimentField(
        "title",
        event.target.value
      );


  $("expObjective").oninput =
    event =>
      updateExperimentField(
        "objective",
        event.target.value
      );


  $("expResult").oninput =
    event =>
      updateExperimentField(
        "result",
        event.target.value
      );


  qsa(".tab")
    .forEach(
      tab => {

        tab.onclick =
          () =>
            switchLanguage(
              tab.dataset.lang
            );

      }
    );


  qsa(".mobile-nav button")
    .forEach(
      button => {

        button.onclick =
          () =>
            mobileNav(
              button.dataset.mobile
            );

      }
    );


  window.addEventListener(
    "message",
    event => {

      if (
        event.data?.type ===
        "console"
      ) {

        addConsole(
          event.data.level ||
            "log",

          event.data.message ||
            ""
        );

      }

    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth >
        900
      ) {

        qsa(
          ".editor-panel,.preview-panel,.console-panel"
        )
        .forEach(
          element =>
            element.style.display =
              ""
        );

      }

    }
  );

}
/* =========================================================
   START APPLICATION
   ========================================================= */

loadState();

bindEvents();

renderAll();


$("themeBtn").textContent =
  state.theme === "dark"
    ? "☾"
    : "☀";
