package com.g174.mmssystem.constant;

public final class Constant {
    private Constant() {
    }

    //utils
    public static final String PAGE = "0";
    public static final String SIZE = "10";
    public static final String ASC = "asc";
    public static final String DESC = "desc";
    //message
    public static final String SUCCESS = "Success!";
    public static final String NOT_FOUND_PRODUCT = "Product not found with id: ";
    public static final String NOT_FOUND_CATEGORY = "Category not found!";
    public static final String SKU_EXISTED = "Sku already exists!";
    public static final String USER_NOT_FOUND = " User not found!";
    //uri
    public static final String ID = "id";
    public static final String API = "/api";
    public static final String PRODUCT = "/product";
    public static final String CATEGORY = "/category";
    public static final String ID_PATH = "/{" + ID + "}";


    //URI API
    public static final String API_PRODUCT = API + PRODUCT;
    public static final String API_CATEGORY = API + CATEGORY;
}
