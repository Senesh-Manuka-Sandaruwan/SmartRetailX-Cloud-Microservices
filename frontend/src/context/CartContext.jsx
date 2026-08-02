import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";


const CART_STORAGE_KEY = "smartretailx_cart";


const CartContext = createContext(null);


const loadStoredCart = () => {
    try {
        const storedCart =
            localStorage.getItem(CART_STORAGE_KEY);

        if (!storedCart) {
            return [];
        }

        const parsedCart = JSON.parse(storedCart);

        return Array.isArray(parsedCart)
            ? parsedCart
            : [];
    } catch {
        localStorage.removeItem(
            CART_STORAGE_KEY
        );

        return [];
    }
};


export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(
        loadStoredCart
    );


    useEffect(() => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cartItems)
        );
    }, [cartItems]);


    const addToCart = (
        product,
        requestedQuantity = 1
    ) => {
        if (!product) {
            return {
                success: false,
                message: "Product information is missing."
            };
        }

        const availableStock =
            Number(product.stock) || 0;

        if (availableStock <= 0) {
            return {
                success: false,
                message: "This product is currently out of stock."
            };
        }

        const normalizedQuantity = Math.max(
            1,
            Number(requestedQuantity) || 1
        );

        let operationResult = {
            success: true,
            message: "Product added to cart."
        };


        setCartItems((currentItems) => {
            const existingItem =
                currentItems.find(
                    (item) =>
                        item.id === product.id
                );

            if (existingItem) {
                const updatedQuantity =
                    existingItem.quantity +
                    normalizedQuantity;

                if (
                    updatedQuantity >
                    availableStock
                ) {
                    operationResult = {
                        success: false,
                        message:
                            `Only ${availableStock} unit(s) ` +
                            "are available."
                    };

                    return currentItems;
                }

                return currentItems.map(
                    (item) =>
                        item.id === product.id
                            ? {
                                  ...item,
                                  name:
                                      product.name,
                                  description:
                                      product.description ||
                                      "",
                                  category:
                                      product.category ||
                                      item.category,
                                  image_url:
                                      product.image_url ||
                                      item.image_url ||
                                      "",
                                  quantity:
                                      updatedQuantity,
                                  stock:
                                      availableStock,
                                  price:
                                      Number(
                                          product.price
                                      ) || 0
                              }
                            : item
                );
            }

            const quantityToAdd = Math.min(
                normalizedQuantity,
                availableStock
            );

            if (
                normalizedQuantity >
                availableStock
            ) {
                operationResult = {
                    success: false,
                    message:
                        `Only ${availableStock} unit(s) ` +
                        "are available."
                };

                return currentItems;
            }

            return [
                ...currentItems,
                {
                    id: product.id,
                    name: product.name,
                    description:
                        product.description || "",
                    category:
                        product.category ||
                        "Uncategorized",
                    image_url:
                        product.image_url || "",
                    price:
                        Number(
                            product.price
                        ) || 0,
                    stock:
                        availableStock,
                    quantity:
                        quantityToAdd
                }
            ];
        });

        return operationResult;
    };


    const removeFromCart = (productId) => {
        setCartItems((currentItems) =>
            currentItems.filter(
                (item) =>
                    item.id !== productId
            )
        );
    };


    const updateQuantity = (
        productId,
        requestedQuantity
    ) => {
        let operationResult = {
            success: true,
            message: "Cart quantity updated."
        };

        setCartItems((currentItems) =>
            currentItems.map((item) => {
                if (item.id !== productId) {
                    return item;
                }

                const normalizedQuantity =
                    Math.max(
                        1,
                        Number(
                            requestedQuantity
                        ) || 1
                    );

                if (
                    normalizedQuantity >
                    item.stock
                ) {
                    operationResult = {
                        success: false,
                        message:
                            `Only ${item.stock} unit(s) ` +
                            "are available."
                    };

                    return item;
                }

                return {
                    ...item,
                    quantity:
                        normalizedQuantity
                };
            })
        );

        return operationResult;
    };


    const increaseQuantity = (productId) => {
        let operationResult = {
            success: true,
            message: "Quantity increased."
        };

        setCartItems((currentItems) =>
            currentItems.map((item) => {
                if (item.id !== productId) {
                    return item;
                }

                if (
                    item.quantity >=
                    item.stock
                ) {
                    operationResult = {
                        success: false,
                        message:
                            `Only ${item.stock} unit(s) ` +
                            "are available."
                    };

                    return item;
                }

                return {
                    ...item,
                    quantity:
                        item.quantity + 1
                };
            })
        );

        return operationResult;
    };


    const decreaseQuantity = (productId) => {
        setCartItems((currentItems) =>
            currentItems
                .map((item) => {
                    if (
                        item.id !== productId
                    ) {
                        return item;
                    }

                    return {
                        ...item,
                        quantity:
                            item.quantity - 1
                    };
                })
                .filter(
                    (item) =>
                        item.quantity > 0
                )
        );
    };


    const clearCart = () => {
        setCartItems([]);
    };


    const refreshCartProduct = (
        updatedProduct
    ) => {
        if (!updatedProduct) {
            return;
        }

        setCartItems((currentItems) =>
            currentItems
                .map((item) => {
                    if (
                        item.id !==
                        updatedProduct.id
                    ) {
                        return item;
                    }

                    const updatedStock =
                        Number(
                            updatedProduct.stock
                        ) || 0;

                    if (updatedStock <= 0) {
                        return null;
                    }

                    return {
                        ...item,
                        name:
                            updatedProduct.name,
                        description:
                            updatedProduct.description ||
                            "",
                        category:
                            updatedProduct.category ||
                            item.category,
                        image_url:
                            updatedProduct.image_url ||
                            item.image_url ||
                            "",
                        price:
                            Number(
                                updatedProduct.price
                            ) || 0,
                        stock:
                            updatedStock,
                        quantity:
                            Math.min(
                                item.quantity,
                                updatedStock
                            )
                    };
                })
                .filter(Boolean)
        );
    };


    const cartItemCount = useMemo(
        () =>
            cartItems.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    item.quantity,
                0
            ),
        [cartItems]
    );


    const cartSubtotal = useMemo(
        () =>
            cartItems.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    (
                        item.price *
                        item.quantity
                    ),
                0
            ),
        [cartItems]
    );


    const isCartEmpty =
        cartItems.length === 0;


    const contextValue = useMemo(
        () => ({
            cartItems,
            cartItemCount,
            cartSubtotal,
            isCartEmpty,
            addToCart,
            removeFromCart,
            updateQuantity,
            increaseQuantity,
            decreaseQuantity,
            clearCart,
            refreshCartProduct
        }),
        [
            cartItems,
            cartItemCount,
            cartSubtotal,
            isCartEmpty
        ]
    );


    return (
        <CartContext.Provider
            value={contextValue}
        >
            {children}
        </CartContext.Provider>
    );
};


export const useCart = () => {
    const context =
        useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside a CartProvider."
        );
    }

    return context;
};


export default CartContext;