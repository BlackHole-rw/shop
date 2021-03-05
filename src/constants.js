const localhost = 'http://127.0.0.1:8000'

const apiURL = '/api'

export const endpoint = `${localhost}${apiURL}`

export const productListURL = `${endpoint}/products/`
export const searchListURL = search => `${endpoint}/products/?search=${search}`
export const productDetailURL = id => `${endpoint}/products/${id}/`
export const addToCartURL = `${endpoint}/add-to-cart/`
export const orderSummaryURL = `${endpoint}/order-summary/`
export const orderItemDeleteURL = id => `${endpoint}/order-summary/${id}/delete/`
export const orderItemMinusURL = `${endpoint}/order-summary-minus/`
export const checkoutURL = `${endpoint}/checkout/`
export const couponFormURL = `${endpoint}/coupon/`
export const addressListURL = activeItem => `${endpoint}/addresses/?address_type=${activeItem}`
export const addressCreateURL = `${endpoint}/addresses/create/`
export const addressUpdateURL = id => `${endpoint}/addresses/${id}/update/`
export const addressDeleteURL = id => `${endpoint}/addresses/${id}/delete/`
export const countryListURL = `${endpoint}/countries/`
export const userIdURL = `${endpoint}/user-id/`
export const paymentHistoryURL = `${endpoint}/payment-history/`