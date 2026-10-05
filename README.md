# ✨ Atelier Éléonore - Handcrafted Fashion Boutique

A luxury, high-fashion e-commerce & atelier website created specifically for an artisan fashion designer selling handmade garments, couture gowns, and made-to-measure bespoke creations.

---

## 🌟 Key Features Included

1. **Editorial Luxury Fashion Aesthetic**:
   - High-fashion typography (Cormorant Garamond + Montserrat).
   - Champagne, ivory, obsidian noir, and warm burnished gold color palette.
   - Dual-angle image hover reveals, artisan badges ("40+ Hours Handcrafting", "100% Mulberry Silk", "Limited Atelier Edition").

2. **Handmade Product Catalog & Storytelling**:
   - Categories: Couture Gowns, Co-Ords & Sets, Outerwear & Jackets, Scarves & Shawls, Accessories.
   - Live category filtering, instant search by fabric or style, and sorting (Price, Rating).
   - Detailed craft transparency (hand-stitched techniques, fabric composition, care guide).

3. **Complimentary Made-to-Measure Sizing**:
   - Clients can choose standard sizes (XS - XL) or select **"Custom Fit"**.
   - Custom fit reveals direct inputs for **Bust, Waist, Hips, and Height**, which are stored with the order for bespoke tailoring.

4. **Multi-Currency Converter**:
   - Instant currency toggle between **USD ($)**, **EUR (€)**, **GBP (£)**, and **INR (₹)** with automatic price recalibration across products, cart, and checkout.

5. **Slide-Out Luxury Bag & Free Shipping Meter**:
   - Real-time subtotal and free shipping progress bar ($200 threshold).
   - Promo code discounts (Demo codes: `MAISON10` for 10% off, `HANDMADE15` for 15% off, `SISTERLOVE` for 20% off).
   - Optional luxury gift wrapping with handwritten calligraphy wax-seal card (+ $10).

6. **Integrated Multi-Step Online Payment & Checkout System**:
   - **Step 1: Client Shipping & Contact**: Auto-fill addresses with postal code and phone validation.
   - **Step 2: Courier Selection**: Complimentary Insured Courier vs Priority White-Glove Express.
   - **Step 3: Online Payment Methods**:
     - **Credit / Debit Cards**: Interactive 3D visual card simulation with real-time card number formatting, Luhn formatting, and expiry verification.
     - **UPI / QR Code**: Instant QR code generator for scan-and-pay via Google Pay, PhonePe, Paytm.
     - **PayPal Express**: One-click PayPal demo checkout.
   - **Security Handshake**: Real-time 256-bit SSL encryption & 3D Secure verification loading animation.
   - **Printable Order Receipt**: Official invoice with order number (e.g. `#AT-482910`), itemized costs, and estimated delivery date.

7. **Bespoke Consultation Request System**:
   - Dedicated inquiry form for bridal, gala, or custom red-carpet commissions with occasion, budget, and vision notes.

8. **👑 Designer Studio (Admin Panel for Your Sister)**:
   - Click the **"👑 Designer Mode"** floating button at the bottom right.
   - **Add New Creations**: Sister can upload photo URLs, set prices, enter fabrics, and describe handcrafting hours directly.
   - **View Received Orders**: Real-time log of customer orders placed in the demo, including customer names, addresses, measurements, and items.
   - **Reset Demo Data**: Easily restore initial demo catalog anytime.

---

## 🚀 How to Run and Preview the Website

### Option 1: Quick Launch with Python
Open your terminal / PowerShell in this folder and run:
```bash
python server.py
```
This automatically starts a local server at `http://localhost:8080` and opens it in your default web browser!

### Option 2: Open Directly in Any Browser
You can simply double-click [index.html](file:///C:/Users/HP/.gemini/antigravity/scratch/atelier-couture/index.html) to open and test the full website directly in Google Chrome, Microsoft Edge, or Safari.

---

## 🎨 How to Customize for Your Sister

1. **Change the Brand Name**:
   - Open `index.html` and search for `Atelier Éléonore`. Replace it with your sister's own brand name (e.g., *Maison Aisha*, *Studio Tara*, etc.).

2. **Add Her Real Photos**:
   - Replace image links in [products.js](file:///C:/Users/HP/.gemini/antigravity/scratch/atelier-couture/products.js) with photos of her actual handmade creations (or upload photos to a free host like Imgur, Cloudinary, or an `images/` subfolder).

3. **Connecting a Live Payment Gateway (When Ready)**:
   - For real payments, you can connect **Stripe Checkout** or **Razorpay** in just a few lines of code:
     - **Stripe**: Create a free Stripe account, generate a Stripe Payment Link for each product or use Stripe.js `stripe.redirectToCheckout({ sessionId })`.
     - **Razorpay**: Add Razorpay Standard Checkout SDK script and plug in her Merchant Key.
     - **PayPal**: Add PayPal JavaScript SDK Buttons (`paypal.Buttons().render(...)`).
