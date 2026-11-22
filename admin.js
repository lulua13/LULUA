const SUPABASE_URL = "https://mbrnzfymxoaolvlwbgxm.supabase.co";
const SUPABASE_KEY = "sb_publishable_mGSWcCdLsZPoG7ROcyXGfw_vqliUAYd";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const loginError = document.getElementById("login-error");
const adminLayout = document.querySelector(".admin-layout");

// Kontrollon nëse përdoruesi është administrator
async function checkAdmin() {
    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) return false;

    const { data, error } =
        await supabaseClient.rpc("is_admin");

    if (error || data !== true) {
        await supabaseClient.auth.signOut();
        return false;
    }

    return true;
}

// Shfaq panelin vetëm për administratorin
async function showDashboard() {
    const isAdmin = await checkAdmin();

    if (isAdmin) {
        loginSection.style.display = "none";
        adminLayout.style.display = "flex";
        await loadProducts();
        await loadOrders();
        await loadCustomers();
        await loadStoreSettings();
    } else {
        loginSection.style.display = "flex";
        adminLayout.style.display = "none";
    }
}

// Hyrja me email dhe fjalëkalim
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    loginError.textContent = "Duke kontrolluar të dhënat...";

    const email =
        document.getElementById("admin-email").value;

    const password =
        document.getElementById("admin-password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginError.textContent =
            "Email ose fjalëkalim i pasaktë.";
        return;
    }

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
        loginError.textContent =
            "Kjo llogari nuk ka të drejta administratori.";
        return;
    }

    loginError.textContent = "";
    await showDashboard();
});

// Kontrolli kur hapet faqja
showDashboard();

async function loadProducts() {
    const productList = document.getElementById("admin-product-list");
    const totalProducts = document.getElementById("total-products");

    if (!productList) return;

    productList.textContent = "Loading products...";

    const { data: products, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        productList.textContent = "Error loading products: " + error.message;
        return;
    }

    productList.replaceChildren();

    if (totalProducts) {
        totalProducts.textContent = products.length;
    }

    const lowStockProducts = document.getElementById("low-stock-products");
    if (lowStockProducts) {
        lowStockProducts.textContent = products.filter(
            product => Number(product.stock) <= 5
        ).length;
    }

    if (products.length === 0) {
        productList.textContent = "No products added yet.";
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "admin-product-card";

        const image = document.createElement("img");
        image.src = product.image_urls?.[0] || "";
        image.alt = product.name;
        image.className = "admin-product-image";

        const details = document.createElement("div");

        const name = document.createElement("h4");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = "Price: " + product.price + "Lekë";

        const category = document.createElement("p");
        category.textContent = "Category: " + product.category;

        const stock = document.createElement("p");
        stock.textContent = "Stock: " + product.stock;

        const deleteButton = document.createElement("button");
        const editButton = document.createElement("button");
        editButton.textContent = "Edit Product";
        editButton.className = "admin-edit-btn";
        editButton.addEventListener("click", () => {
            editProduct(product);
        });
        deleteButton.textContent = "Delete Product";
        deleteButton.className = "admin-delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteProduct(product);
    });

    details.append(
        name, 
        price, 
        category, 
        stock, 
        editButton,
        deleteButton
    );
    card.append(image, details);
    productList.appendChild(card);
    });
}

async function loadOrders() {
    const ordersList = document.getElementById("admin-orders-list");
    const totalOrders = document.getElementById("total-orders");
    if (!ordersList) return;
    ordersList.textContent = "Loading orders...";
    const { data: orders, error} = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        ordersList.textContent = "Error loading orders:" + error.message;
        return;
    }
    totalOrders.textContent = orders.length;
    ordersList.replaceChildren();
    const revenueByCurrency = {};
    orders
        .filter(order => order.status === "delivered")
        .forEach(order => {
            const currency = order.currency || "ALL";
            revenueByCurrency[currency] =
                (revenueByCurrency[currency] || 0) + Number(order.total || 0);
        });
    const revenueElement = document.getElementById("total-revenue");
    if (revenueElement) {
        const revenueText = Object.entries(revenueByCurrency)
            .map(([currency, amount]) =>
                `${currency} ${amount.toLocaleString("sq-AL", {
                    maximumFractionDigits: 2
                })}`
            )
            .join(" · ");
        revenueElement.textContent = revenueText || "0";
    }
    if (orders.length === 0) {
        ordersList.textContent = "No orders received yet.";
        return;
    }
    orders.forEach(order => {
        const card = document.createElement("div");
        card.style.padding = "20px";
        card.style.marginBottom = "20px";
        card.style.border = "1px solid #eee";
        card.style.borderRadius = "6px";
        const title = document.createElement("h3");
        title.textContent = "Order #" + order.id.slice(0, 8);
        const customer = document.createElement("p");
        customer.textContent = "Customer: " + order.customer_name;
        const phone = document.createElement("p");
        phone.textContent = "Phone: " + order.customer_phone;
        const location = document.createElement("p");
        location.textContent =
            "Location: " + order.city + ", " + order.country;
        const address = document.createElement("p");
        address.textContent = "Address: " + order.address;
        const items = document.createElement("div");
        items.style.marginTop = "12px";
        (order.items || []).forEach(item => {
            const itemText = document.createElement("p");
            itemText.textContent =
                `${item.name} | Size: ${item.size} | Color: ${item.color} | Quantity: ${item.quantity}`;
            items.appendChild(itemText);
        });
        const total = document.createElement("h3");
        total.style.marginTop = "15px";
        total.textContent =
            "Total: " + order.total + " " + order.currency;
        const statusLabel = document.createElement("label");
        statusLabel.textContent = "Order Status: ";
        statusLabel.style.fontWeight = "bold";
        const statusSelect = document.createElement("select");
        statusSelect.style.padding = "8px";
        statusSelect.style.marginTop = "10px";
        const statuses = [
            { value: "new", label: "New" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" }
        ];
        statuses.forEach(item => {
            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.label;
            statusSelect.appendChild(option);
        });
        statusSelect.value = order.status;
        statusSelect.addEventListener("change", async () => {
            statusSelect.disabled = true;
            const { error } = await supabaseClient
                .from("orders")
                .update({ status: statusSelect.value })
                .eq("id", order.id);
            if (error) {
                alert("Error updating order status: " + error.message);
                statusSelect.value = order.status;
            } else {
                order.status = statusSelect.value;
                alert("Order status updated successfully!");
            }
            statusSelect.disabled = false;
        })
        const date = document.createElement("p");
        date.style.color = "#777";
        date.style.fontSize = "12px";
        date.style.marginTop = "8px";
        date.textContent =
            "Date: " + new Date(order.created_at).toLocaleString();
        card.append(
            title,
            customer,
            phone,
            location,
            address,
            items,
            total,
            statusLabel,
            statusSelect,
            date
        );
        ordersList.appendChild(card);
    }); 
}

async function loadCustomers() {
    const customersList = document.getElementById("admin-customers-list");
    if(!customersList) return;
    customersList.textContent = "Loading customers...";
    const { data: orders, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        customersList.textContent = "Error loading customers: " + error.message;
        return;
    }
    customersList.replaceChildren();
    if (!orders || orders.length === 0) {
        customersList.textContent = "No customers yet.";
        return;
    }
    const customers = {};
    orders.forEach(order => {
        const phone = order.customer_phone;
        if (!customers[phone]) {
            customers[phone] = {
            name: order.customer_name,
            phone: phone,
            country: order.country,
            city: order.city,
            address: order.address,
            orders: 0,
            totalSpent: 0
            };
        }
        customers[phone].orders++;
        customers[phone].totalSpent += Number(order.total);
    });
    Object.values(customers).forEach(customer => {
        const card = document.createElement("div");
        card.style.padding = "20px";
        card.style.marginBottom = "20px";
        card.style.border = "1px solid #eee";
        card.style.borderRadius = "6px";
        const name = document.createElement("h3");
        name.textContent = customer.name;
        const phone = document.createElement("p");
        phone.textContent = "Phone: " + customer.phone;
        const location = document.createElement("p");
        location.textContent =
            "Location: " + customer.city + ", " + customer.country;
        const address = document.createElement("p");
        address.textContent = "Address: " + customer.address;
        const orderCount = document.createElement("p");
        orderCount.textContent = "Total orders: " + (customer.orders || 0);
        const spent = document.createElement("h4");
        spent.textContent =
            "Total spent: " + customer.totalSpent.toFixed(2);
        card.append(
            name,
            phone,
            location,
            address,
            orderCount,
            spent
        );
        customersList.appendChild(card);
    });
}

async function loadStoreSettings() {
    const { data, error } =await supabaseClient
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();
    if (error) {
        console.error("Error loading store settings:", error.message);
        return;
    }
    document.getElementById("store-name").value =
        data.store_name || "";
    document.getElementById("store-email").value =
        data.contact_email || "";
    document.getElementById("store-phone").value =
        data.phone_number || "";
    document.getElementById("store-instagram").value =
        data.instagram || "";
    document.getElementById("store-address").value =
        data.store_address || "";
}

document.getElementById("store-settings-form")
    .addEventListener("submit", async (event) => {
        event.preventDefault();
        const settings = {
            id: 1,
            store_name: document.getElementById("store-name").value,
            contact_email: document.getElementById("store-email").value,
            phone_number: document.getElementById("store-phone").value,
            instagram: document.getElementById("store-instagram").value,
            store_address: document.getElementById("store-address").value,
            updated_at: new Date().toISOString()
        };
        const message = document.getElementById("settings-message");
        const button = event.target.querySelector('button[type="submit"]');
        button.disabled = true
        button.textContent = "Saving...";
        const { error } = await supabaseClient
            .from("store_settings")
            .upsert(settings, { onConflict: "id" });
        if (error) {
            message.textContent = "Error saving settings: " + error.message;
            message.style.color = "red";
        } else {
            message.textContent = "Settings saved sucessfully!";
            message.style.color = "green";
        }
        button.disabled = false;
        button.textContent = "Saving Settings";
    });

const productForm = document.getElementById("product-form");
const productMessage = document.getElementById("product-message");
const productImageInput = document.getElementById("product-image");
const imagePreview = document.getElementById("product-image-preview");

let editingProduct = null;

// Fotografitë e produktit, sipas rendit të zgjedhjes
let productImages = [];

// Merr path-in e fotos nga URL e Supabase
function getStoragePathFromUrl(url) {
    if (!url) return null;

    const marker = "/product-images/";
    const index = url.indexOf(marker);

    if (index === -1) return null;

    let path = url.substring(index + marker.length);
    path = path.split("?")[0];

    try {
        path = decodeURIComponent(path);
    } catch (error) {
        console.error(error);
    }

    return path || null;
}

// Merr të gjitha path-et e fotove të një produkti
function getProductImagePaths(product) {
    const paths = new Set();

    if (product.image_path) {
        paths.add(product.image_path);
    }

    (product.image_urls || []).forEach(url => {
        const path = getStoragePathFromUrl(url);

        if (path) paths.add(path);
    });

    return [...paths];
}

// Shfaq fotografitë në panel
function renderProductImages() {
    imagePreview.replaceChildren();

    productImages.forEach((image, index) => {
        const item = document.createElement("div");
        item.className = "image-preview-item";

        const img = document.createElement("img");
        img.src = image.url;
        img.alt = "Product image " + (index + 1);

        item.appendChild(img);

        // Fotoja e parë është gjithmonë kryesorja
        if (index === 0) {
            const mainLabel = document.createElement("span");
            mainLabel.className = "main-image-label";
            mainLabel.textContent = "MAIN PHOTO";
            item.appendChild(mainLabel);
        }

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-image-btn";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            if (image.isNew) {
                URL.revokeObjectURL(image.url);
            }

            productImages.splice(index, 1);
            renderProductImages();
        });

        item.appendChild(removeButton);
        imagePreview.appendChild(item);
    });
}

// Pastro fotografitë e zgjedhura
function clearProductImages() {
    productImages.forEach(image => {
        if (image.isNew) {
            URL.revokeObjectURL(image.url);
        }
    });

    productImages = [];
    productImageInput.value = "";

    renderProductImages();
}

// Shto fotografitë një nga një
productImageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        productMessage.textContent =
            "Zgjidh vetëm fotografi të vlefshme.";
        this.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        productMessage.textContent =
            "Fotografia duhet të jetë maksimumi 5MB.";
        this.value = "";
        return;
    }

    const imageUrl = URL.createObjectURL(file);

    productImages.push({
        file: file,
        url: imageUrl,
        storagePath: null,
        isNew: true
    });

    productMessage.textContent = "";

    renderProductImages();

    // Lejon zgjedhjen e një fotografie tjetër
    this.value = "";
});

// Ruajtja e produktit
productForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    productMessage.textContent = "Duke ruajtur të dhënat...";

    const submitButton =
        document.getElementById("product-submit-btn");

    submitButton.disabled = true;

    const name =
        document.getElementById("product-name").value.trim();

    const description =
        document.getElementById("product-description").value.trim();

    const price =
        Number(document.getElementById("product-price").value);

    const category =
        document.getElementById("product-category").value;

    const sizes =
        document.getElementById("product-sizes").value
            .split(",").map(item => item.trim()).filter(Boolean);

    const colors =
        document.getElementById("product-colors").value
            .split(",").map(item => item.trim()).filter(Boolean);

    const stock =
        Number(document.getElementById("product-stock").value);

    if (productImages.length === 0) {
        productMessage.textContent =
            "Zgjidh të paktën një fotografi.";
        submitButton.disabled = false;
        return;
    }

    const uploadedImagePaths = [];

    try {
        // Ngarkojmë fotot e reja një nga një
        for (const image of productImages) {
            if (!image.isNew) continue;

            const extension =
                image.file.name.split(".").pop().toLowerCase();

            const newPath =
                `${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } =
                await supabaseClient.storage
                    .from("product-images")
                    .upload(newPath, image.file);

            if (uploadError) throw uploadError;

            uploadedImagePaths.push(newPath);

            const { data: urlData } =
                supabaseClient.storage
                    .from("product-images")
                    .getPublicUrl(newPath);

            image.url = urlData.publicUrl;
            image.storagePath = newPath;
        }

        // Ruajmë fotot sipas rendit të tyre
        const allImageUrls = productImages.map(image => image.url);

        // Fotoja e parë është fotografia kryesore
        const mainImagePath =
            productImages[0].storagePath || null;

        const productData = {
            name,
            description,
            price,
            category,
            sizes,
            colors,
            stock,
            image_urls: allImageUrls,
            image_path: mainImagePath
        };

        let saveError;

        if (editingProduct) {
            const { error } = await supabaseClient
                .from("products")
                .update(productData)
                .eq("id", editingProduct.id);

            saveError = error;
        } else {
            const { error } = await supabaseClient
                .from("products")
                .insert([productData]);

            saveError = error;
        }

        if (saveError) throw saveError;

        // Fshijmë nga Storage fotot që janë hequr gjatë editimit
        if (editingProduct) {
            const retainedPaths = productImages
                .map(image => image.storagePath)
                .filter(Boolean);

            const removedPaths =
                getProductImagePaths(editingProduct)
                    .filter(path => !retainedPaths.includes(path));

            if (removedPaths.length > 0) {
                const { error: removeError } =
                    await supabaseClient.storage
                        .from("product-images")
                        .remove(removedPaths);

                if (removeError) {
                    console.error(
                        "Fotot e hequra nuk u fshinë nga Storage:",
                        removeError.message
                    );
                }
            }
        }

        productMessage.textContent = editingProduct
            ? "Produkti u ndryshua me sukses!"
            : "Produkti u shtua me sukses!";

        editingProduct = null;

        productForm.reset();
        clearProductImages();

        document.getElementById("edit-product-id").value = "";

        document.getElementById("product-submit-btn").textContent =
            "Add Product";

        document.getElementById("cancel-edit-btn").style.display =
            "none";

        await loadProducts();

    } catch (error) {
        console.error("Product error:", error);

        // Fshijmë fotot e ngarkuara nëse ruajtja dështon
        if (uploadedImagePaths.length > 0) {
            await supabaseClient.storage
                .from("product-images")
                .remove(uploadedImagePaths);
        }

        productMessage.textContent =
            "Gabim: " + error.message;

    } finally {
        submitButton.disabled = false;
    }
});

// Fshirja e produktit
async function deleteProduct(product) {
    const confirmed = window.confirm(
        `A je e sigurt që dëshiron të fshish produktin "${product.name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
        alert("Gabim gjatë fshirjes: " + error.message);
        return;
    }

    const imagePaths = getProductImagePaths(product);

    if (imagePaths.length > 0) {
        const { error: imageError } = await supabaseClient
            .storage
            .from("product-images")
            .remove(imagePaths);

        if (imageError) {
            console.error(
                "Fotografitë nuk u fshinë:",
                imageError.message
            );
        }
    }

    await loadProducts();

    alert("Produkti u fshi me sukses!");
}

// Editimi i produktit
function editProduct(product) {
    editingProduct = product;

    clearProductImages();

    document.getElementById("edit-product-id").value = product.id;

    document.getElementById("product-name").value =
        product.name;

    document.getElementById("product-description").value =
        product.description || "";

    document.getElementById("product-price").value =
        product.price;

    document.getElementById("product-category").value =
        product.category;

    document.getElementById("product-sizes").value =
        (product.sizes || []).join(", ");

    document.getElementById("product-colors").value =
        (product.colors || []).join(", ");

    document.getElementById("product-stock").value =
        product.stock;

    // Ngarkojmë fotot ekzistuese në rendin e ruajtur
    let existingUrls = [...(product.image_urls || [])];

    if (existingUrls.length === 0 && product.image_path) {
        const { data } = supabaseClient.storage
            .from("product-images")
            .getPublicUrl(product.image_path);

        existingUrls.push(data.publicUrl);
    }

    productImages = existingUrls.map((url, index) => ({
        file: null,
        url: url,
        storagePath:
            getStoragePathFromUrl(url) ||
            (index === 0 ? product.image_path : null),
        isNew: false
    }));

    renderProductImages();

    document.getElementById("product-submit-btn").textContent =
        "Save Changes";

    document.getElementById("cancel-edit-btn").style.display =
        "inline-block";

    productMessage.textContent =
        "Po ndryshon produktin: " + product.name;

    document.getElementById("products").scrollIntoView({
        behavior: "smooth"
    });
}

// Anulimi i editimit
const cancelEditButton =
    document.getElementById("cancel-edit-btn");

if (cancelEditButton) {
    cancelEditButton.addEventListener("click", function () {
        editingProduct = null;

        productForm.reset();
        clearProductImages();

        document.getElementById("edit-product-id").value = "";

        document.getElementById("product-submit-btn").textContent =
            "Add Product";

        cancelEditButton.style.display = "none";

        productMessage.textContent = "Editimi u anulua.";
    });
}