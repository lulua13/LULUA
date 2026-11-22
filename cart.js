function loadCart() {
    const cartContainer = document.getElementById("cart-container");

    let cart = JSON.parse(localStorage.getItem("luluaCart")) || [];

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Shporta jote është bosh</h2>
                <p>Eksploro koleksionin tonë dhe gjej produktin tënd të preferuar.</p>
                <a href="index.html" class="continue-shopping">
                    Vazhdo blerjet
                </a>
            </div>
        `;
        return;
    }

    let total = 0;

    cartContainer.innerHTML = `
        <div class="cart-items">
            ${cart.map((item, index) => {
                const itemTotal = Number(item.price) * Number(item.quantity);
                total += itemTotal;

                return `
                    <div class="cart-item">
                        <img src="${item.image || ""}" alt="${item.name}">

                        <div class="cart-item-info">
                            <h3>${item.name}</h3>
                            <p>Madhësia: ${item.size}</p>
                            <p>Ngjyra: ${item.color}</p>
                            <p>Çmimi: ${Number(item.price).toFixed(2)} Lekë</p>

                            <div class="cart-quantity">
                                <button onclick="changeQuantity(${index}, -1)">−</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQuantity(${index}, 1)">+</button>
                            </div>

                            <button class="remove-cart-item"
                                onclick="removeFromCart(${index})">
                                Hiq produktin
                            </button>
                        </div>

                        <strong>${itemTotal.toFixed(2)} Lekë</strong>
                    </div>
                `;
            }).join("")}
        </div>

        <div class="cart-summary">
            <h2>Totali: ${total.toFixed(2)} Lekë</h2>
            <button id="checkout-btn">Vazhdo te porosia</button>
        </div>
    `;

    document.getElementById("checkout-btn").addEventListener("click", function() {
        window.location.href = "checkout.html";
    });
}

function changeQuantity(index, amount) {
    let cart = JSON.parse(localStorage.getItem("luluaCart")) || [];

    if (!cart[index]) return;

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem("luluaCart", JSON.stringify(cart));
    loadCart();
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem("luluaCart")) || [];

    cart.splice(index, 1);

    localStorage.setItem("luluaCart", JSON.stringify(cart));
    loadCart();
}

loadCart();
