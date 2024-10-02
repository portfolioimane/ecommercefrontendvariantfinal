import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { addOrder } from '../redux/orderSlice';
import { clearCart } from '../redux/cartSlice';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import './CheckoutPage.css';
import { FaCreditCard, FaPaypal, FaTruck } from 'react-icons/fa';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ totalPrice, itemsToDisplay, paymentMethod, setPaymentMethod, loading, setLoading, userEmail, orderData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Update orderData here to include values from the form
    const updatedOrderData = {
      ...orderData,
      name: event.target.name.value,
      phone: event.target.phone.value,
      address: event.target.address.value,
    };

    try {
      if (paymentMethod === 'credit-card') {
        const { data: paymentResponse } = await axios.post('/api/payment', { total_price: totalPrice });
        
        const result = await stripe.confirmCardPayment(paymentResponse.paymentIntent.client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

        if (result.error) {
          console.error(result.error.message);
          setLoading(false);
          return;
        }
        console.log("updateddata", updatedOrderData);
        const { data: orderResponse } = await axios.post('/api/orders', {
          ...updatedOrderData,
          payment_method: 'credit card',
          payment_status: 'paid',
        });

        dispatch(addOrder(orderResponse.order));
        dispatch(clearCart());
        localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
        navigate(`/thank-you/order/${orderResponse.order.id}`);

      } else if (paymentMethod === 'cash-on-delivery') {
        const { data: orderResponse } = await axios.post('/api/orders', {
          ...updatedOrderData,
          payment_method: 'cash on delivery',
          payment_status: 'pending',
        });

        dispatch(addOrder(orderResponse.order));
        dispatch(clearCart());
        localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
        navigate(`/thank-you/order/${orderResponse.order.id}`);
      }
      
    } catch (error) {
      console.error('Error processing order:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" value={userEmail} readOnly />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input type="tel" id="phone" required />
      </div>
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input type="text" id="address" required />
      </div>

      <h4>Payment Method</h4>
      <div className="payment-methods">
        <div className="payment-option">
          <input type="radio" id="credit-card" name="payment" value="credit-card" required onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="credit-card">
            <FaCreditCard className="payment-icon" /> Credit Card
          </label>
          {paymentMethod === 'credit-card' && <CardElement />}
        </div>
        <div className="payment-option">
          <input type="radio" id="paypal" name="payment" value="paypal" required onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="paypal">
            <FaPaypal className="payment-icon" /> PayPal
          </label>
          {paymentMethod === 'paypal' && (
            <PayPalButtons
              style={{ layout: 'horizontal' }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: totalPrice,
                    },
                  }],
                });
              }}
              onApprove={async (data, actions) => {
                const details = await actions.order.capture();
                const updatedOrderData = {
                  ...orderData,
                  name: document.getElementById('name').value,
                  phone: document.getElementById('phone').value,
                  address: document.getElementById('address').value,
                };
                const { data: orderResponse } = await axios.post('/api/orders', {
                  ...updatedOrderData,
                  payment_status: 'paid',
                  payment_method:'paypal',
                  paypal_details: details,
                });

                dispatch(addOrder(orderResponse.order));
                dispatch(clearCart());
                localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
                navigate(`/thank-you/order/${orderResponse.order.id}`);
              }}
            />
          )}
        </div>
        <div className="payment-option">
          <input type="radio" id="cash-on-delivery" name="payment" value="cash-on-delivery" required onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="cash-on-delivery">
            <FaTruck className="payment-icon" /> Cash on Delivery
          </label>
        </div>
      </div>

{paymentMethod !== 'paypal' && (
  <button type="submit" className="order-button" disabled={loading}>Place Order</button>
)}
    </form>
  );
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items || []);
  const guestItems = useSelector(state => state.cart.guestItems || []);
  const isLoggedIn = useSelector(state => !!state.auth.token);
  const userEmail = useSelector(state => state.auth.user?.email);

  const itemsToDisplay = isLoggedIn ? cartItems : guestItems;
  const totalPrice = itemsToDisplay.reduce((total, item) => total + (Number(item.price) * item.quantity), 0).toFixed(2);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [loading, setLoading] = useState(false);

  // Define the orderData object here
  const orderData = {
    email: userEmail,
    total_price: totalPrice,
    items: itemsToDisplay.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
  };

  return (
    <Elements stripe={stripePromise}>
    <PayPalScriptProvider options={{ "client-id":  process.env.REACT_APP_PAYPAL_CLIENT_ID }}>
         <div className="checkout-container">
          <h2>Checkout</h2>
          <div className="checkout-content">
            <div className="checkout-form">
              <h3>Billing Information</h3>
              <CheckoutForm 
                totalPrice={totalPrice}
                itemsToDisplay={itemsToDisplay}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                loading={loading}
                setLoading={setLoading}
                userEmail={isLoggedIn ? userEmail : ''}
                orderData={orderData} // Pass orderData to the CheckoutForm
              />
            </div>

            <div className="cart-summary">
              <h3>Cart Summary</h3>
              <ul>
                {itemsToDisplay.map(item => (
                  <li key={item.id} className="cart-item">
                    <img src={`${process.env.REACT_APP_API_URL}/storage/${item.image}`} alt={isLoggedIn ? item.product.name : item.name} className="item-image" />
                    <div className="item-details">
                      <p className="item-name">{isLoggedIn ? item.product.name : item.name}</p>
                      <p className="item-quantity">Quantity: {item.quantity}</p>
                      <p className="item-price">{Number(item.price).toFixed(2)} MAD</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="total-price">
                <h4>Total: {totalPrice} MAD</h4>
              </div>
            </div>
          </div>
        </div>
      </PayPalScriptProvider>
    </Elements>
  );
};

export default CheckoutPage;
