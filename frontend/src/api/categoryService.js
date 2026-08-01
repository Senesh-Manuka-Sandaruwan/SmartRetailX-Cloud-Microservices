import {
    productServiceAPI
} from "./axiosConfig";


const extractErrorMessage = (
    error,
    defaultMessage
) => {
    const detail =
        error.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(" ");
    }

    return defaultMessage;
};


export const getCategories = async () => {
    try {
        const response =
            await productServiceAPI.get(
                "/categories/"
            );

        return Array.isArray(response.data)
            ? response.data
            : [];
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to load categories."
            )
        );
    }
};


export const getCategoryById = async (
    categoryId
) => {
    try {
        const response =
            await productServiceAPI.get(
                `/categories/${categoryId}`
            );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to load this category."
            )
        );
    }
};


export const createCategory = async (
    categoryData
) => {
    try {
        const response =
            await productServiceAPI.post(
                "/categories/",
                {
                    name:
                        categoryData.name.trim(),

                    description:
                        categoryData.description
                            ?.trim() ||
                        null
                }
            );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to create this category."
            )
        );
    }
};


export const updateCategory = async (
    categoryId,
    categoryData
) => {
    try {
        const payload = {};

        if (
            categoryData.name !== undefined
        ) {
            payload.name =
                categoryData.name.trim();
        }

        if (
            categoryData.description !== undefined
        ) {
            payload.description =
                categoryData.description
                    ?.trim() ||
                null;
        }

        const response =
            await productServiceAPI.put(
                `/categories/${categoryId}`,
                payload
            );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to update this category."
            )
        );
    }
};


export const deleteCategory = async (
    categoryId
) => {
    try {
        const response =
            await productServiceAPI.delete(
                `/categories/${categoryId}`
            );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to delete this category."
            )
        );
    }
};


const categoryService = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};


export default categoryService;