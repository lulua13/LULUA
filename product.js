const SUPABASE_URL = "https://mbrnzfymxoaolvlwbgxm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mGSWcCdLsZPoG7ROcyXGfw_vqliUAYd";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function loadProduct() {
    const productDetails = document.getElementById("product-details");

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        productDetails.innerHTML = "<p>Produkti nuk u gjet.</p>";
        return;
    }

    const { data: product, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .single();

    if (error || !product) {
        console.error("Gabim gjatë ngarkimit:", error);
        productDetails.innerHTML = "<p>Nuk mundëm ta ngarkonim produktin.</p>";
        return;
    }

    window.currentProduct = product;

    console.log("Të dhënat e produktit:", product);

    const images = Array.isArray(product.image_urls)
        ? product.image_urls.filter(Boolean)
        : [];

    images.forEach((url, index) => {
        const img = new Image();

        img.onload = () => {
            console.log(`Foto ${index + 1} u ngarkua me sukses`);
        };

        img.onerror = () => {
            console.error(`Foto ${index + 1} nuk u ngarkua:`, url);
        };

        img.src = url;
    });

    // SHFAQJA E PRODUKTIT

    productDetails.innerHTML = `
        <div class="product-detail-layout">

            <div class="product-detail-images">
                ${images.length > 0 ? `
                    <div class="product-image-slider">
                        <div class="product-image-track" id="product-image-track">
                            ${images.map((image, index) => `
                                <div class="product-image-slide">
                                    <img
                                        src="${image}"
                                        alt="${product.name} - Foto ${index + 1}"
                                        class="main-product-image"
                                    >
                                </div>
                            `).join("")}
                        </div>

                        ${images.length > 1 ? `
                            <div class="product-image-dots" id="product-image-dots">
                                ${images.map((image, index) => `
                                    <button
                                        type="button"
                                        class="product-image-dot ${index === 0 ? "active" : ""}"
                                        data-slide="${index}"
                                        aria-label="Shfaq foton ${index + 1}"
                                    ></button>
                                `).join("")}
                            </div>
                        ` : ""}
                    </div>
                ` : ""}
            </div>

            <div class="product-detail-info">
                <p class="product-detail-category">${product.category || ""}</p>

                <h1>${product.name}</h1>

                <p class="product-detail-price">
                    ${product.price} Lekë
                </p>

                <p class="product-detail-description">${(product.description || "Nuk ka përshkrim për këtë produkt.").trim()}</p>

                <label for="product-size">Madhësia</label>
                <select id="product-size">
                    ${(product.sizes || []).map(size =>
                        `<option value="${size}">${size}</option>`
                    ).join("")}
                </select>

                <label for="product-color">Ngjyra</label>
                <select id="product-color">
                    ${(product.colors || []).map(color =>
                        `<option value="${color}">${color}</option>`
                    ).join("")}
                </select>

                <label for="product-quantity">Sasia</label>
                <input
                    type="number"
                    id="product-quantity"
                    value="1"
                    min="1"
                    max="${product.stock || 1}"
                >

                <button type="button" id="add-to-cart-btn">
                    Shto në shportë
                </button>
            </div>

        </div>
    `;

    // GALERIA E FOTOGRAFIVE

    const imageTrack = document.getElementById("product-image-track");
    const imageDots = document.getElementById("product-image-dots");

    if (imageTrack) {
        const slides = imageTrack.querySelectorAll(".product-image-slide");
        const dots = imageDots
            ? imageDots.querySelectorAll(".product-image-dot")
            : [];

        function updateActiveDot() {
            const currentIndex = Math.min(
                slides.length - 1,
                Math.max(0, Math.round(
                    imageTrack.scrollLeft / imageTrack.clientWidth
                ))
            );

            dots.forEach((dot, index) => {
                dot.classList.toggle("active", index === currentIndex);
            });
        }

        // Klikimi mbi pikat
        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                imageTrack.scrollTo({
                    left: slides[index].offsetLeft,
                    behavior: "smooth"
                });
            });
        });

        // Ndryshimi automatik gjatë rrëshqitjes
        imageTrack.addEventListener("scroll", updateActiveDot, {
            passive: true
        });

        updateActiveDot();
    }
}

// SHTIMI NË SHPORTË

document.addEventListener("click", function(event) {
    if (event.target.id !== "add-to-cart-btn") return;

    const size = document.getElementById("product-size").value;
    const color = document.getElementById("product-color").value;
    const quantity = Number(document.getElementById("product-quantity").value);

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    const product = window.currentProduct;

    if (!product || !quantity || quantity < 1) {
        alert("Kontrollo produktin dhe sasinë!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("luluaCart")) || [];

    const existingItem = cart.find(item =>
        String(item.id) === String(productId) &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image_urls?.[0] || "",
            size: size,
            color: color,
            quantity: quantity
        });
    }

    localStorage.setItem("luluaCart", JSON.stringify(cart));
    alert("Produkti u shtua në shportë!");
});

loadProduct();
