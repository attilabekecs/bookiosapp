/* BookPlex – HTML preview based on your SwiftUI views:
   - HomeView: hero + continue reading + recently added
   - LibraryView: grid + searchable + import (mock)
   - BookDetailView: editable fields + pills + toggles + actions
*/

const state = {
  tab: "home",
  route: { name: "tab", tab: "home" }, // or {name:"detail", id:"b1"}
  search: "",
  reader: { open: false, bookId: null, page: 1, progress: 12 },
  books: [
    {
      id: "b1",
      title: "Fourth Wing",
      author: "Rebecca Yarros",
      summary: "A brutal war college for dragon riders, where survival is never guaranteed.",
      format: "EPUB",
      isbn13: "9781649374042",
      shareToCommunity: true,
      coverStyle: "linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.06))",
      addedAt: daysAgo(2),
      lastOpenedAt: daysAgo(0.2),
    },
    {
      id: "b2",
      title: "Iron Flame",
      author: "Rebecca Yarros",
      summary: "The second year gets darker, deadlier, and far more political.",
      format: "EPUB",
      isbn13: "",
      shareToCommunity: false,
      coverStyle: "linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.04))",
      addedAt: daysAgo(5),
      lastOpenedAt: daysAgo(1.4),
    },
    {
      id: "b3",
      title: "Project Hail Mary",
      author: "Andy Weir",
      summary: "A lone astronaut must save Earth with science, humor, and an unexpected friend.",
      format: "PDF",
      isbn13: "9780593135204",
      shareToCommunity: true,
      coverStyle: "linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.05))",
      addedAt: daysAgo(9),
      lastOpenedAt: daysAgo(3),
    },
    {
      id: "b4",
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      summary: "A legendary story told by the legend himself—music, magic, and tragedy.",
      format: "PDF",
      isbn13: "",
      shareToCommunity: false,
      coverStyle: "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.06))",
      addedAt: daysAgo(13),
      lastOpenedAt: daysAgo(7),
    }
  ],
};

const appEl = document.getElementById("app");
const tabs = Array.from(document.querySelectorAll(".tab"));
const topActions = document.getElementById("topActions");

// ---------- Routing ----------
function setTab(tab) {
  state.tab = tab;
  state.route = { name: "tab", tab };
  window.location.hash = `#${tab}`;
  render();
}

function openDetail(bookId) {
  state.route = { name: "detail", id: bookId };
  window.location.hash = `#book/${bookId}`;
  render();
}

function parseHash() {
  const h = (window.location.hash || "#home").slice(1);
  if (h.startsWith("book/")) {
    const id = h.split("/")[1];
    state.route = { name: "detail", id };
    state.tab = "library";
  } else {
    const tab = h || "home";
    if (["home","library","community","requests","profile"].includes(tab)) {
      state.route = { name: "tab", tab };
      state.tab = tab;
    }
  }
}

// ---------- Helpers ----------
function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

function sortByDateDesc(arr, key) {
  return [...arr].sort((a,b)=> (b[key]?.getTime?.()||0) - (a[key]?.getTime?.()||0));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}

function button(text, cls, onClick) {
  return el("button", { class: `btn ${cls||""}`, onclick: onClick }, [text]);
}

function pill(icon, text) {
  return el("span", { class: "pill" }, [
    icon ? el("span", { class: "pillIcon" }, [icon]) : "",
    el("span", {}, [text])
  ]);
}

function posterCard(book, { fixedWidth=true } = {}) {
  const p = el("div", { class: "poster", onclick: () => openDetail(book.id) }, [
    el("div", { class: "posterTop" }, [
      el("div", { class: "coverMock", style: `background:${book.coverStyle};` })
    ]),
    el("div", { class: "posterTitle" }, [book.title]),
    el("p", { class: "posterAuthor" }, [book.author || "Unknown author"]),
  ]);
  if (!fixedWidth) p.style.width = "auto";
  return p;
}

// ---------- Views ----------
function viewHome() {
  const booksByAdded = sortByDateDesc(state.books, "addedAt");
  const booksByOpened = sortByDateDesc(state.books, "lastOpenedAt");

  const hero = (() => {
    const pick = booksByAdded[0];
    if (!pick) {
      return el("div", { class: "heroCard" }, [
        el("div", { class: "heroMeta" }, [
          el("div", { class: "heroTitle" }, ["No books yet"]),
          el("p", { class: "heroDesc" }, ["Go to Library and import your first book."]),
        ])
      ]);
    }
    return el("div", { class: "heroCard", onclick: () => openDetail(pick.id) }, [
      el("div", { class: "heroGlow" }),
      el("div", { class: "heroMeta" }, [
        el("div", { class: "heroTitle" }, [pick.title]),
        el("p", { class: "heroAuthor" }, [pick.author || "Unknown author"]),
        el("p", { class: "heroDesc" }, [pick.summary || "Add a description in book details."]),
      ])
    ]);
  })();

  const continueReading = el("section", { class: "section" }, [
    sectionHeader("Continue reading", "▶️"),
    el("div", { class: "row" }, booksByOpened.slice(0,12).map(b => posterCard(b)))
  ]);

  const recentAdded = el("section", { class: "section" }, [
    sectionHeader("Recently added", "🕒"),
    el("div", { class: "row" }, booksByAdded.slice(0,12).map(b => posterCard(b)))
  ]);

  return el("div", {}, [
    el("div", { class: "heroLabel" }, ["Recommended"]),
    hero,
    continueReading,
    recentAdded,
  ]);
}

function viewLibrary() {
  const q = state.search.trim().toLowerCase();
  const filtered = !q ? state.books : state.books.filter(b =>
    (b.title||"").toLowerCase().includes(q) || (b.author||"").toLowerCase().includes(q)
  );
  const booksByAdded = sortByDateDesc(filtered, "addedAt");

  const searchBar = el("div", { class: "gridTop" }, [
    el("div", { class: "search" }, [
      el("span", { class: "mag" }, ["🔎"]),
      el("input", {
        type: "text",
        placeholder: "Search title or author",
        value: state.search,
        oninput: (e) => { state.search = e.target.value; render(); }
      })
    ]),
    button("＋ Import (mock)", "primary", () => {
      // Mock: add a dummy book so you see the flow
      const id = "b" + Math.floor(Math.random()*10000);
      state.books.unshift({
        id,
        title: "Imported Book " + id,
        author: "Unknown author",
        summary: "Imported from device (mock). In iOS this is FileImporter + Metadata pipeline.",
        format: Math.random() > 0.5 ? "PDF" : "EPUB",
        isbn13: "",
        shareToCommunity: false,
        coverStyle: "linear-gradient(135deg, rgba(255,255,255,.20), rgba(255,255,255,.05))",
        addedAt: new Date(),
        lastOpenedAt: null
      });
      render();
    })
  ]);

  const grid = el("div", { class: "grid" },
    booksByAdded.map(b => {
      const card = posterCard(b, { fixedWidth:false });
      return card;
    })
  );

  return el("div", { class: "gridWrap" }, [
    searchBar,
    grid.length ? grid : el("div", { class: "empty" }, ["No books match your search."])
  ]);
}

function viewDetail(bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (!book) return el("div", { class: "empty" }, ["Book not found."]);

  const left = el("div", { class: "card" }, [
    el("div", { class: "posterTop", style: "height: 340px; border-radius: 18px;" }, [
      el("div", { class: "coverMock", style: `background:${book.coverStyle};` })
    ]),
    el("div", { class: "pills" }, [
      pill("📄", (book.format || "UNKNOWN").toUpperCase()),
      ...(book.isbn13 ? [pill("🏷️", `ISBN: ${book.isbn13}`)] : []),
    ]),
    el("div", { class: "smallNote" }, [
      "SwiftUI megfelelő: PosterCard + Pill(format/isbn)."
    ])
  ]);

  // editable fields like BookDetailView
  const titleInput = el("input", { value: book.title, oninput: (e)=> book.title = e.target.value });
  const authorInput = el("input", { value: book.author, oninput: (e)=> book.author = e.target.value });
  const summaryInput = el("textarea", { oninput: (e)=> book.summary = e.target.value }, [book.summary || ""]);

  const toggle = el("label", { class: "toggle" }, [
    el("input", {
      type: "checkbox",
      checked: book.shareToCommunity ? "checked" : null,
      onchange: (e)=> { book.shareToCommunity = e.target.checked; }
    }),
    el("span", {}, ["Share metadata to community (no file)"])
  ]);

  const right = el("div", { class: "card" }, [
    el("div", { class: "sectionHeader", style: "padding: 0 0 10px;"} , [
      el("span", { class: "icon" }, ["ℹ️"]),
      el("h2", {}, ["Details"]),
      el("div", { class: "spacer" }),
      button("Save", "ghost", () => {
        // Mock save: just re-render
        render();
      })
    ]),

    field("Title", titleInput),
    field("Author", authorInput),
    field("Summary", summaryInput),
    toggle,

    el("div", { class: "actions" }, [
      button("📖 Read", "primary", () => openReader(book.id)),
      button("✨ Refresh metadata", "", () => {
        // Mock: slightly tweak summary so you see an effect
        book.summary = (book.summary || "") + (book.summary ? " " : "") + "• Refreshed (mock).";
        render();
      }),
      button("🗑️ Delete book", "danger", () => {
        state.books = state.books.filter(b => b.id !== book.id);
        window.location.hash = "#library";
        parseHash();
        render();
      }),
    ]),

    el("div", { class: "smallNote", style: "margin-top:12px" }, [
      "SwiftUI megfelelő: TextField-ek + Toggle + Read/Refresh/Delete gombok."
    ])
  ]);

  return el("div", { class: "detail" }, [left, right]);
}

function viewPlaceholder(title, icon, text) {
  return el("div", { class: "card" }, [
    el("div", { class: "sectionHeader", style: "padding: 0 0 10px;"} , [
      el("span", { class: "icon" }, [icon]),
      el("h2", {}, [title]),
      el("div", { class: "spacer" })
    ]),
    el("div", { class: "smallNote" }, [text])
  ]);
}

// ---------- UI bits ----------
function sectionHeader(title, icon) {
  return el("div", { class: "sectionHeader" }, [
    el("span", { class: "icon" }, [icon]),
    el("h2", {}, [title]),
    el("div", { class: "spacer" })
  ]);
}

function field(labelText, inputEl) {
  return el("div", { class: "field" }, [
    el("label", {}, [labelText]),
    inputEl
  ]);
}

// ---------- Reader modal ----------
const overlay = document.getElementById("readerOverlay");
const closeReaderBtn = document.getElementById("closeReaderBtn");
const readerTitle = document.getElementById("readerTitle");
const readerFormat = document.getElementById("readerFormat");
const readerProgress = document.getElementById("readerProgress");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

closeReaderBtn.addEventListener("click", closeReader);
overlay.addEventListener("click", (e)=> { if (e.target === overlay) closeReader(); });

prevPageBtn.addEventListener("click", ()=> {
  state.reader.page = Math.max(1, state.reader.page - 1);
  state.reader.progress = Math.max(1, state.reader.progress - 2);
  updateReaderUI();
});
nextPageBtn.addEventListener("click", ()=> {
  state.reader.page += 1;
  state.reader.progress = Math.min(100, state.reader.progress + 2);
  updateReaderUI();
});

function openReader(bookId) {
  state.reader.open = true;
  state.reader.bookId = bookId;
  state.reader.page = 1;
  state.reader.progress = 12;

  const b = state.books.find(x => x.id === bookId);
  readerTitle.textContent = b ? `Reader – ${b.title}` : "Reader";
  readerFormat.textContent = b?.format || "PDF";
  updateReaderUI();

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeReader() {
  state.reader.open = false;
  state.reader.bookId = null;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function updateReaderUI() {
  readerProgress.textContent = `${state.reader.progress}% • Page ${state.reader.page}`;
}

// ---------- Render ----------
function renderTopActions() {
  topActions.innerHTML = "";
  if (state.route.name === "tab" && state.tab === "library") {
    topActions.appendChild(el("div", { class: "smallNote" }, ["Search + Import mock a Library tetején ⬇️"]));
  } else if (state.route.name === "detail") {
    topActions.appendChild(el("div", { class: "smallNote" }, ["Detail view (BookDetailView)"]));
  } else {
    topActions.appendChild(el("div", { class: "smallNote" }, ["HomeView / TabView preview"]));
  }
}

function renderTabs() {
  tabs.forEach(t => {
    const active = t.dataset.tab === state.tab && state.route.name !== "detail";
    t.classList.toggle("active", active);
  });
}

function render() {
  renderTopActions();
  renderTabs();

  appEl.innerHTML = "";

  if (state.route.name === "detail") {
    appEl.appendChild(viewDetail(state.route.id));
    // keep tab highlight on Library feel
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === "library"));
    return;
  }

  switch (state.tab) {
    case "home":
      appEl.appendChild(viewHome());
      break;
    case "library":
      appEl.appendChild(viewLibrary());
      break;
    case "community":
      appEl.appendChild(viewPlaceholder(
        "Community",
        "👥",
        "Itt lenne a CommunityView (trusted users, shared library, chat). Most egy placeholder, hogy a tabok működjenek."
      ));
      break;
    case "requests":
      appEl.appendChild(viewPlaceholder(
        "Requests",
        "🔎",
        "Itt lenne a RequestsView (book requests/keresések). Placeholder."
      ));
      break;
    case "profile":
      appEl.appendChild(viewPlaceholder(
        "Profile",
        "👤",
        "Itt lenne a ProfileView (settings, groups). Placeholder."
      ));
      break;
    default:
      appEl.appendChild(viewHome());
  }
}

// ---------- Events ----------
tabs.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
window.addEventListener("hashchange", () => { parseHash(); render(); });

// Init
parseHash();
render();
