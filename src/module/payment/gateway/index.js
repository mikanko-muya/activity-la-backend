import { fakeGateway } from "./fake.gateway.js";
import { phajayGateway } from "./phajay.gateway.js";

const gateways = {
    phajay: phajayGateway,
    fake: fakeGateway,
};

// Read on every call rather than once at import, so a script can choose the
// fake before it creates payments without caring about import order.
export const getPaymentGateway = () => {
    const name = process.env.PAYMENT_GATEWAY ?? "phajay";
    const gateway = gateways[name];

    if (!gateway) throw new Error(`Unknown PAYMENT_GATEWAY "${name}"`);

    if (name === "fake" && process.env.NODE_ENV === "production") {
        throw new Error("The fake payment gateway cannot be used in production");
    }

    return gateway;
};
