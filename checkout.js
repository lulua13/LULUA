const SUPABASE_URL = "https://mbrnzfymxoaolvlwbgxm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mGSWcCdLsZPoG7ROcyXGfw_vqliUAYd";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const cart = JSON.parse(localStorage.getItem("luluaCart")) || [];

const countryInput = document.getElementById("customer-country");
const cityInput = document.getElementById("customer-city");
const cityOptions = document.getElementById("city-options");
const summary = document.getElementById("checkout-summary");
const rateInfo = document.getElementById("exchange-rate-info");
const message = document.getElementById("checkout-message");
const form = document.getElementById("checkout-form");
const submitButton = document.getElementById("place-order-btn");

let euroRate = null;
let rateTimestamp = null;

const cities = {
    Albania: [
        "Tiranë", "Shkodër", "Elbasan", "Vlorë", "Korçë",
        "Fier", "Berat", "Lushnjë", "Pogradec", "Kavajë",
        "Laç", "Lezhë", "Kukës", "Gjirokastër", "Patosi",
        "Krujë", "Kuçovë", "Sarandë", "Peshkopi", "Burrel",
        "Cërrik", "Skrapar", "Shijak", "Librazhd", "Tepelenë",
        "Gramsh", "Policani", "Bulqizë", "Përmet", "Fushë Krujë",
        "Kamëz", "Rrëshen", "Ballsh", "Mamurras", "Bajram Curri",
        "Ersekë", "Peqin", "Divjakë", "Selenica", "Bilisht",
        "Roskovec", "Këlcyrë", "Pukë", "Memaliaj", "Rrogozhinë",
        "Ura Vajgurore", "Himarë", "Delvinë", "Vorë", "Koplik",
        "Maliq", "Prrenjas", "Libohovë", "Orikum", "Fushë Arrëz",
        "Shëngjin", "Rubik", "Milot", "Leskovik", "Konispol",
        "Durrës", "Has", "Bajzë", "Velipojë", "Bushat", "Reps",
        "Vau i Dejës", "Tropojë", "Maqellarë", "Klos", "Manez",
        "Sukth", "Durrës Plazh", "Shkozet", "Levan", "Belsh",
        "Lushnje Fier Shegan", "Fier Cakran", "Dhërmi", "Borsh",
        "Lukovë", "Qeparo", "Sarandë Livadhja", "Devoll", "Dibër",
        "Dropull", "Finiq", "Kolonjë", "Kurbin", "Malësi e Madhe",
        "Mallakastër", "Mat", "Mirditë", "Pustec", "Blesh"
    ],
    Kosovo: [
        "Artanë", "Burim", "Deçan", "Dragash", "Drenas", "Ferizaj",
        "Fushë Kosovë", "Gjakovë", "Gjilan", "Graçaninë", "Hajvali",
        "Hani i Elezit", "Junik", "Kaçanik", "Kamenicë", "Kastriot",
        "Klinë", "Kllokot", "Leposaviç", "Lipjan", "Malishevë",
        "Mamushë", "Mitrovicë", "Novobërda", "Partesh", "Pejë",
        "Preshevcë", "Podujevë", "Prishtinë", "Prizren", "Rahovec",
        "Ranillug", "Shterpcë", "Shtime", "Skënderaj", "Therandë",
        "Vushtrri", "Zubinpotok", "Zveqan", "Obiliq"
    ]
};

function fillCities(country) {
    cityOptions.innerHTML = "";
    cityInput.value = "";

    if (!country || !cities[country]) return;

    showCityOptions(cities[country]);
}

function showCityOptions(cityList) {
    cityOptions.innerHTML = "";

    if (cityList.length === 0) {
        cityOptions.innerHTML =
            '<div class="city-option">Nuk u gjet qyteti</div>';
        cityOptions.classList.add("show");
        return;
    }

    cityList.forEach(city => {
        const option = document.createElement("div");
        option.className = "city-option";
        option.textContent = city;
        option.addEventListener("click", () => {
            cityInput.value = city;
            cityOptions.classList.remove("show");
            updateSummary();
        });

        cityOptions.appendChild(option);
    });

    cityOptions.classList.add("show")
}

countryInput.addEventListener("change", () => {
    fillCities(countryInput.value);
});

cityInput.addEventListener("focus", () => {
    const country = countryInput.value;

    if (country && cities[country]) {
        showCityOptions(cities[country]);
    }
});

cityInput.addEventListener("input", () => {
    const country = countryInput.value;
    if(!country || !cities[country]) return;
    const search = cityInput.value
        .toLocaleLowerCase("sq")
        .trim();
    const filteredCities = cities[country].filter(city =>
        city.toLocaleLowerCase("sq").includes(search)
    );
    showCityOptions(filteredCities);
    updateSummary();
});

document.addEventListener("click", (event) => {
    if (
        !cityInput.contains(event.target) &&
        !cityOptions.contains(event.target)
    ) {
        cityOptions.classList.remove("show");
    }
});

async function getExchangeRate() {
    try {
        const response = await fetch("https://api.kursi.al/api/rate/EUR");

        if (!response.ok) {
            throw new Error("Nuk u mor kursi i këmbimit.");
        }

        const data = await response.json();

        if (!data.rate || Number(data.rate) <= 0) {
            throw new Error("Kursi i këmbimit nuk është i vlefshëm.");
        }

        euroRate = Number(data.rate);
        rateTimestamp = data.timestamp || null;

        return true;
    } catch (error) {
        console.error(error);
        rateInfo.textContent =
            "Nuk mundëm të marrim kursin aktual EUR/ALL. Provo përsëri më vonë.";
        return false;
    }
}

function formatMoney(amount, currency) {
    return `${Number(amount).toFixed(2)} ${currency}`;
}

function calculateOrder() {
    const country = countryInput.value;
    const city = cityInput.value.trim();

    const subtotalALL = cart.reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    if (country === "Albania") {
        const normalizedCity = city.toLocaleLowerCase("sq");
        const shipping = ["tiranë", "tirane"].includes(normalizedCity)
            ? 200
            : 300;

        return {
            subtotal: subtotalALL,
            shipping,
            total: subtotalALL + shipping,
            currency: "lekë"
        };
    }

    if (country === "Kosovo" && euroRate) {
        const subtotalEUR = subtotalALL / euroRate;
        const shipping = 7;

        return {
            subtotal: subtotalEUR,
            shipping,
            total: subtotalEUR + shipping,
            currency: "€"
        };
    }

    return null;
}

function updateSummary() {
    if (!cart.length) {
        summary.textContent = "Shporta është bosh.";
        return;
    }

    const order = calculateOrder();

    if (!order) {
        summary.textContent = "Zgjidh shtetin për të parë totalin.";
        return;
    }

    summary.innerHTML = `
        <p>Nëntotali: ${formatMoney(order.subtotal, order.currency)}</p>
        <p>Transporti: ${formatMoney(order.shipping, order.currency)}</p>
        <hr>
        <h3>Totali: ${formatMoney(order.total, order.currency)}</h3>
    `;
}

async function initializeCheckout() {
    if (!cart.length) {
        summary.textContent = "Shporta është bosh. Kthehu te shporta për të shtuar produkte.";
        submitButton.disabled = true;
        return;
    }

    await getExchangeRate();

    if (euroRate) {
        rateInfo.textContent =
            `Kursi i përdorur: 1 EUR = ${euroRate.toFixed(2)} ALL` +
            (rateTimestamp
                ? ` | Përditësuar: ${new Date(rateTimestamp).toLocaleString("sq-AL")}`
                : "");
    }

    updateSummary();
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    const country = countryInput.value;
    const city = cityInput.value.trim();

    if (!cart.length) {
        message.textContent = "Shporta është bosh.";
        return;
    }

    if (!country || !city) {
        message.textContent = "Plotëso shtetin dhe qytetin.";
        return;
    }

    if (country === "Kosovo" && !euroRate) {
        message.textContent = "Nuk kemi kursin aktual të këmbimit. Provo përsëri.";
        return;
    }

    const order = calculateOrder();

    if (!order) {
        message.textContent = "Nuk mundëm të llogarisim totalin.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Duke dërguar porosinë...";

    try {
        const { data: products, error: productsError } =
            await supabaseClient
                .from("products")
                .select("id, name, price, is_active")
                .in("id", cart.map(item => item.id));

        if (productsError) throw productsError;

        if (!products || products.length !== cart.length ||
            products.some(product => !product.is_active)) {
            throw new Error("Disa produkte nuk janë më të disponueshme.");
        }

        const verifiedSubtotalALL = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);

            if (!product) throw new Error("Produkt i pavlefshëm në shportë.");

            return sum + Number(product.price) * Number(item.quantity);
        }, 0);

        const verifiedSubtotal = country === "Kosovo"
            ? verifiedSubtotalALL / euroRate
            : verifiedSubtotalALL;

        const verifiedShipping = country === "Kosovo"
            ? 7
            : (["tiranë", "tirane", ["tirana"]].includes(city.toLocaleLowerCase("sq")) ? 200 : 300);

        const currency = country === "Kosovo" ? "EUR" : "ALL";

        const items = cart.map(item => {
            const product = products.find(p => p.id === item.id);

            return {
                product_id: product.id,
                name: product.name,
                price_ALL: Number(product.price),
                size: item.size,
                color: item.color,
                quantity: Number(item.quantity)
            };
        });

        const orderData = {
            customer_name: document.getElementById("customer-name").value.trim(),
            customer_phone: document.getElementById("customer-phone").value.trim(),
            country,
            city,
            address: document.getElementById("customer-address").value.trim(),
            notes: document.getElementById("customer-notes").value.trim(),
            payment_method: "cash_on_delivery",
            currency,
            subtotal: Number(verifiedSubtotal.toFixed(2)),
            shipping: verifiedShipping,
            total: Number((verifiedSubtotal + verifiedShipping).toFixed(2)),
            exchange_rate: country === "Kosovo" ? euroRate : null,
            exchange_rate_timestamp: rateTimestamp,
            items
        };

        const { error } = await supabaseClient
            .from("orders")
            .insert([orderData]);

        if (error) throw error;

        localStorage.removeItem("luluaCart");

        message.textContent = "Porosia u regjistrua me sukses! Faleminderit për besimin.";
        summary.textContent = "Porosia u konfirmua.";
        form.reset();
    } catch (error) {
        console.error(error);
        message.textContent =
            "Porosia nuk u regjistrua: " + error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Konfirmo porosinë";
    }
});

initializeCheckout();