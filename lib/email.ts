import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image_url: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    full_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export interface ShippingUpdateData {
  orderNumber: string
  customerName: string
  customerEmail: string
  trackingNumber: string
  status: string
  estimatedDelivery: string
}

export interface StyleRecommendationData {
  customerName: string
  customerEmail: string
  recommendations: Array<{
    name: string
    price: number
    image_url: string
    reason: string
  }>
}

export const emailService = {
  async sendOrderConfirmation(data: OrderConfirmationData) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: "MANUS <orders@manus.style>",
        to: [data.customerEmail],
        subject: `Order Confirmation - ${data.orderNumber}`,
        html: generateOrderConfirmationHTML(data),
      })

      if (error) throw error
      return result
    } catch (error) {
      console.error("Error sending order confirmation:", error)
      throw error
    }
  },

  async sendShippingUpdate(data: ShippingUpdateData) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: "MANUS <shipping@manus.style>",
        to: [data.customerEmail],
        subject: `Shipping Update - ${data.orderNumber}`,
        html: generateShippingUpdateHTML(data),
      })

      if (error) throw error
      return result
    } catch (error) {
      console.error("Error sending shipping update:", error)
      throw error
    }
  },

  async sendStyleRecommendations(data: StyleRecommendationData) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: "MANUS <style@manus.style>",
        to: [data.customerEmail],
        subject: "Personalized Style Recommendations from MANUS",
        html: generateStyleRecommendationsHTML(data),
      })

      if (error) throw error
      return result
    } catch (error) {
      console.error("Error sending style recommendations:", error)
      throw error
    }
  },

  async sendWelcomeEmail(customerName: string, customerEmail: string) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: "MANUS <welcome@manus.style>",
        to: [customerEmail],
        subject: "Welcome to MANUS - Your Style Journey Begins",
        html: generateWelcomeHTML(customerName),
      })

      if (error) throw error
      return result
    } catch (error) {
      console.error("Error sending welcome email:", error)
      throw error
    }
  },
}

function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 30px; }
        .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
        .item:last-child { border-bottom: none; }
        .item img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px; }
        .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
        .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #0891b2; padding-top: 15px; }
        .address { background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { background-color: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">MANUS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order Confirmation</p>
        </div>
        
        <div class="content">
          <h2>Thank you for your order, ${data.customerName}!</h2>
          <p>Your order <strong>${data.orderNumber}</strong> has been confirmed and is being prepared for shipment.</p>
          
          <div class="order-details">
            <h3 style="margin-top: 0;">Order Items</h3>
            ${data.items
              .map(
                (item) => `
              <div class="item">
                <img src="${item.image_url}" alt="${item.name}" />
                <div style="flex: 1;">
                  <div style="font-weight: 500;">${item.name}</div>
                  <div style="color: #6b7280;">Quantity: ${item.quantity}</div>
                </div>
                <div style="font-weight: 500;">$${item.price.toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
            
            <div style="margin-top: 20px;">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${data.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping:</span>
                <span>$${data.shipping.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>$${data.tax.toFixed(2)}</span>
              </div>
              <div class="total-row final">
                <span>Total:</span>
                <span>$${data.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <h3>Shipping Address</h3>
          <div class="address">
            <strong>${data.shippingAddress.full_name}</strong><br>
            ${data.shippingAddress.address_line_1}<br>
            ${data.shippingAddress.address_line_2 ? data.shippingAddress.address_line_2 + "<br>" : ""}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postal_code}<br>
            ${data.shippingAddress.country}
          </div>
          
          <p>We'll send you a shipping confirmation email with tracking information once your order ships.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Thank you for choosing MANUS</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Elevating men's style, one piece at a time</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateShippingUpdateHTML(data: ShippingUpdateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipping Update</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 30px; }
        .tracking-info { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #0891b2; margin: 10px 0; }
        .status-badge { display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 500; }
        .footer { background-color: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">MANUS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Shipping Update</p>
        </div>
        
        <div class="content">
          <h2>Your order is on its way, ${data.customerName}!</h2>
          <p>Order <strong>${data.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          <div class="tracking-info">
            <div class="status-badge">${data.status}</div>
            <div class="tracking-number">${data.trackingNumber}</div>
            <p style="margin: 15px 0 0 0; color: #6b7280;">Estimated delivery: <strong>${data.estimatedDelivery}</strong></p>
          </div>
          
          <p>You can track your package using the tracking number above. We'll notify you once your order has been delivered.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Thank you for choosing MANUS</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Elevating men's style, one piece at a time</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateStyleRecommendationsHTML(data: StyleRecommendationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Style Recommendations</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 30px; }
        .recommendation { display: flex; align-items: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
        .recommendation:last-child { border-bottom: none; }
        .recommendation img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 20px; }
        .price { font-size: 18px; font-weight: bold; color: #0891b2; }
        .reason { color: #6b7280; font-style: italic; margin-top: 5px; }
        .footer { background-color: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">MANUS</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Personalized Style Recommendations</p>
        </div>
        
        <div class="content">
          <h2>Curated just for you, ${data.customerName}</h2>
          <p>Based on your style preferences and wardrobe, we've selected these pieces that would complement your collection perfectly.</p>
          
          ${data.recommendations
            .map(
              (item) => `
            <div class="recommendation">
              <img src="${item.image_url}" alt="${item.name}" />
              <div style="flex: 1;">
                <div style="font-weight: 500; font-size: 16px;">${item.name}</div>
                <div class="price">$${item.price.toFixed(2)}</div>
                <div class="reason">${item.reason}</div>
              </div>
            </div>
          `,
            )
            .join("")}
          
          <p style="margin-top: 30px;">Visit your MANUS dashboard to see how these pieces would look with your existing wardrobe.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Thank you for choosing MANUS</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Elevating men's style, one piece at a time</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWelcomeHTML(customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MANUS</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #10b981 100%); color: white; padding: 50px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .feature { display: flex; align-items: center; margin: 25px 0; }
        .feature-icon { width: 50px; height: 50px; background-color: #f0f9ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #10b981 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0; }
        .footer { background-color: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">Welcome to MANUS</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your style journey begins now</p>
        </div>
        
        <div class="content">
          <h2>Hello ${customerName},</h2>
          <p>Welcome to MANUS, where luxury menswear meets intelligent styling. We're excited to help you elevate your wardrobe with pieces that perfectly complement your existing style.</p>
          
          <div class="feature">
            <div class="feature-icon">👔</div>
            <div>
              <h3 style="margin: 0 0 5px 0;">Smart Wardrobe Management</h3>
              <p style="margin: 0; color: #6b7280;">Catalog your existing pieces and see how new items integrate with your wardrobe</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <div>
              <h3 style="margin: 0 0 5px 0;">AI-Powered Recommendations</h3>
              <p style="margin: 0; color: #6b7280;">Get personalized styling suggestions based on your preferences and lifestyle</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">✨</div>
            <div>
              <h3 style="margin: 0 0 5px 0;">Outfit Planning</h3>
              <p style="margin: 0; color: #6b7280;">Create and save complete outfits for any occasion</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" class="cta-button">Start Building Your Wardrobe</a>
          </div>
          
          <p>If you have any questions, our style experts are here to help. Simply reply to this email or visit our support center.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Thank you for choosing MANUS</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Elevating men's style, one piece at a time</p>
        </div>
      </div>
    </body>
    </html>
  `
}
