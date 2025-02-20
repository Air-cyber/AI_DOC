import React, { useEffect, useState } from "react";

function PaytmButton() {
  const [paymentData, setPaymentData] = useState({
    token: "",
    order: "",
    mid: "",
    amount: 100,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    setLoading(true);

    let orderId = "Order_" + new Date().getTime();
    let mid = "YOUR_MERCHANT_ID"; // Replace with your actual MID
    let mkey = "YOUR_MERCHANT_KEY"; // Replace with your actual Merchant Key

    let paytmParams = {
      body: {
        requestType: "Payment",
        mid: mid,
        websiteName: "WEBSTAGING",
        orderId: orderId,
        callbackUrl: "https://merchant.com/callback",
        txnAmount: {
          value: 100,
          currency: "INR",
        },
        userInfo: {
          custId: "1001",
        },
      },
    };

    try {
      // This API call should be handled by your backend for security reasons.
      const response = await fetch("https://your-backend.com/paytm-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paytmParams),
      });

      const data = await response.json();

      if (data.body?.txnToken) {
        setPaymentData({
          token: data.body.txnToken,
          order: orderId,
          mid: mid,
          amount: 100,
        });
      } else {
        console.error("Failed to retrieve transaction token", data);
      }
    } catch (error) {
      console.error("Error initializing transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const makePayment = () => {
    if (!paymentData.token) {
      alert("Payment token is missing. Please try again.");
      return;
    }

    const config = {
      root: "",
      style: {
        bodyBackgroundColor: "#fafafb",
        themeBackgroundColor: "#0FB8C9",
        themeColor: "#ffffff",
        headerBackgroundColor: "#284055",
        headerColor: "#ffffff",
      },
      data: {
        orderId: paymentData.order,
        token: paymentData.token,
        tokenType: "TXN_TOKEN",
        amount: paymentData.amount,
      },
      payMode: {
        order: ["CC", "DC", "NB", "UPI", "PPBL", "PPI", "BALANCE"],
      },
      website: "WEBSTAGING",
      flow: "DEFAULT",
      merchant: {
        mid: paymentData.mid,
        redirect: false,
      },
      handler: {
        transactionStatus: (paymentStatus) => {
          console.log("Transaction Status:", paymentStatus);
        },
        notifyMerchant: (eventName, data) => {
          console.log("Payment closed:", eventName, data);
        },
      },
    };

    if (window.Paytm && window.Paytm.CheckoutJS) {
      window.Paytm.CheckoutJS.init(config)
        .then(() => {
          window.Paytm.CheckoutJS.invoke();
        })
        .catch((error) => {
          console.error("Error initializing Paytm checkout:", error);
        });
    } else {
      console.error("Paytm SDK not loaded.");
    }
  };

  return (
    <div>
      {loading ? (
        <img
          src="https://c.tenor.com/I6kN-6X7nhAAAAAj/loading-buffering.gif"
          alt="Loading..."
        />
      ) : (
        <button onClick={makePayment}>Pay Now</button>
      )}
    </div>
  );
}

export default PaytmButton;
