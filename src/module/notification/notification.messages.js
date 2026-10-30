// The notifications the server writes itself, in Lao and English. Each returns
// the four text fields a notification row needs; the reader's app shows one
// language. `event` is the order's event, with its Lao title and titleEn.

const kip = (amount) => `${Number(amount).toLocaleString("en-US")} ₭`;

export const orderPlacedMessage = ({ event, minutes, amount }) => ({
    title: "ສັ່ງຊື້ສຳເລັດ",
    titleEn: "Order placed",
    message:
        `ຄຳສັ່ງຊື້ຂອງທ່ານສຳລັບ "${event.title}" ຖືກຈອງໄວ້ ${minutes} ນາທີ. ` +
        `ກະລຸນາຊຳລະ ${kip(amount)} ເພື່ອຢືນຢັນປີ້ຂອງທ່ານ.`,
    messageEn:
        `Your order for "${event.titleEn}" is reserved for ${minutes} minutes. ` +
        `Pay ${kip(amount)} to confirm your tickets.`,
});

export const orderCancelledMessage = ({ event, couponReleased }) => ({
    title: "ຍົກເລີກຄຳສັ່ງຊື້ແລ້ວ",
    titleEn: "Order cancelled",
    message:
        `ຄຳສັ່ງຊື້ຂອງທ່ານສຳລັບ "${event.title}" ຖືກຍົກເລີກແລ້ວ ແລະ ປີ້ຖືກປ່ອຍຄືນ.` +
        (couponReleased ? " ທ່ານສາມາດໃຊ້ຄູປອງຂອງທ່ານໄດ້ອີກຄັ້ງ." : ""),
    messageEn:
        `Your order for "${event.titleEn}" has been cancelled and the tickets released.` +
        (couponReleased ? " Your coupon is available to use again." : ""),
});

export const paymentReceivedMessage = ({ event, amount, ticketCount }) => ({
    title: "ໄດ້ຮັບການຊຳລະເງິນແລ້ວ",
    titleEn: "Payment received",
    message:
        `ພວກເຮົາໄດ້ຮັບເງິນ ${kip(amount)} ສຳລັບ "${event.title}" ແລ້ວ. ` +
        `ປີ້ ${ticketCount} ໃບ ພ້ອມແລ້ວໃນຄຳສັ່ງຊື້ຂອງທ່ານ.`,
    messageEn:
        `We received ${kip(amount)} for "${event.titleEn}". ` +
        (ticketCount === 1 ? "Your ticket is" : `${ticketCount} tickets are`) +
        " ready in your order.",
});

// The reason comes from the bank or gateway in English, so both languages
// quote it as given.
export const paymentFailedMessage = ({ event, reason }) => ({
    title: "ການຊຳລະເງິນບໍ່ສຳເລັດ",
    titleEn: "Payment failed",
    message:
        `ການຊຳລະເງິນສຳລັບ "${event.title}" ບໍ່ສຳເລັດ${reason ? `: ${reason}` : ""}. ` +
        "ທ່ານສາມາດລອງໃໝ່ໄດ້ ໃນຂະນະທີ່ການຈອງຍັງບໍ່ໝົດເວລາ.",
    messageEn:
        `Your payment for "${event.titleEn}" did not go through${reason ? `: ${reason}` : ""}. ` +
        "You can try again while the reservation lasts.",
});
