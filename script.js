const SUPABASE_URL = "https://mbrnzfymxoaolvlwbgxm.supabase.co";
const SUPABASE_KEY = "sb_publishable_mGSWcCdLsZPoG7ROcyXGfw_vqliUAYd";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("LULUA është lidhur me Supabase!");

async function testDatabase() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("id")
        .limit(1);

    if (error) {
        console.error("Gabim në databazë:", error.message);
        return;
    }

    console.log("Lidhja me databazën funksionon!", data);
}

testDatabase();

// Shfaq produktet në website

let allWebsiteProducts = []
function displayWebsiteProducts(products) {
    const productContainer = document.getElementById("product-container");
    if (!productContainer) return;
    productContainer.replaceChildren();
    if(products.length === 0) {
        productContainer.textContent = "Nuk u gjet asnjë produkt.";
        return;
    }
    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            window.location.href =
                `product.html?id=${encodeURIComponent(product.id)}`;
        });
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = product.image_urls?.[0] || "";
    image.alt = product.name;
    image.loading = "lazy";
    const details = document.createElement("div");
    details.className = "product-info";
    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category || "";
    const name = document.createElement("h3");
    name.textContent = product.name;
    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent =
        new Intl.NumberFormat("sq-AL").format(Number(product.price)) + " Lekë";
    details.append(category, name, price);
    card.append(image, details);
    productContainer.appendChild(card);
    });
}
    async function loadWebsiteProducts() {
        const productContainer = document.getElementById("product-container");
        if (!productContainer) return;
        productContainer.textContent = "Po ngarkohen produktet...";
        const { data: products, error } = await supabaseClient
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false});
        if (error) {
            console.error("Gabim gjatë ngarkimit të produkteve:", error);
            productContainer.textContent =
                "Produktet nuk mund të ngarkoheshin. Provo përsëri më vonë.";
            return;
        }
        allWebsiteProducts = products || [];
        if (allWebsiteProducts.length === 0) {
            productContainer.textContent =
                "Së shpejti do të shtojmë produktet tona.";
            return;
        }
        displayWebsiteProducts(allWebsiteProducts);
}

// SEARCH & CATEGORY ITEMS
const searchToggle = document.getElementById("search-toggle");
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("product-search");
const searchClose = document.getElementById("search-close");

// PRODUCT FILTERS AND SORTING
const collectionLinks = document.querySelectorAll(".collection-card a");
const filterButtons = document.querySelectorAll(".filter-btn");
const productSort = document.getElementById("product-sort");
let selectedCategory = "all";

// FILTER AND SORT PRODUCTS
function filterWebsiteProducts() {

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let filteredProducts = allWebsiteProducts.filter(product => {

        const name = (product.name || "").toLowerCase();
        const category = (product.category || "").trim().toLowerCase();

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const matchesSearch =
            name.includes(searchTerm) ||
            category.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    // SORT PRODUCTS
    const sortValue = productSort ? productSort.value : "newest";

    if (sortValue === "price-low") {
        filteredProducts.sort((a, b) => 
            Number(a.price) - Number(b.price)
        );
    }

    else if (sortValue === "price-high") {
        filteredProducts.sort((a, b) =>
            Number(b.price) - Number(a.price)
        );
    }

    else if (sortValue === "newest") {
        filteredProducts.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
    }
    displayWebsiteProducts(filteredProducts);
}

// SEARCH
if (searchToggle && searchPanel && searchInput) {

    searchToggle.addEventListener("click", () => {
        searchPanel.hidden = false;
        searchInput.focus();
    });

    searchInput.addEventListener("input", filterWebsiteProducts);
}

// Mbyllja e SEARCH
if (searchClose && searchInput) {

    searchClose.addEventListener("click", () => {
        searchInput.value = "";
        searchPanel.hidden = true;
        filterWebsiteProducts();
    });
}

// COLLECTION LINKS
collectionLinks.forEach(link => {
    link.addEventListener("click", () => {
        selectedCategory = link.dataset.category;
        filterButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === selectedCategory
            );
        });
        filterWebsiteProducts();
    });
});

// PRODUCT FILTER BUTTONS
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });
        filterWebsiteProducts();
    });
});

// PRODUCT SORTING
if (productSort) {
    productSort.addEventListener("change", filterWebsiteProducts);
}

// VIEW ALL COLLECTIONS
const viewAllButton = document.getElementById("view-all-collections");

if (viewAllButton) {
    viewAllButton.addEventListener("click", () => {
        selectedCategory = "all";

        filterButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === "all"
            );
        });
        
        if (searchInput) {
            searchInput.value = "";
        }

        filterWebsiteProducts();
    });
}

loadWebsiteProducts();

// MOBILE HAMBURGER MENU

const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileMenu = document.querySelector("header nav");

if (mobileMenuToggle && mobileMenu) {

    mobileMenuToggle.addEventListener("click", () => {

        const isOpen = document.querySelector("header")
            .classList.toggle("mobile-menu-open");

        mobileMenuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );

        mobileMenuToggle.textContent = isOpen ? "×" : "☰";

        mobileMenuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu"
        );

    });

    // Close menu after selecting a link
    mobileMenu.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            document.querySelector("header")
                .classList.remove("mobile-menu-open");

            mobileMenuToggle.textContent = "☰";
            mobileMenuToggle.setAttribute("aria-expanded", "false");
            mobileMenuToggle.setAttribute("aria-label", "Open menu");

        });

    });

}
