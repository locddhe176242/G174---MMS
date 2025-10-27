package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Query(value = "SELECT * FROM Products p WHERE (:fieldSearch IS NULL OR p.name LIKE %:fieldSearch% OR p.sku LIKE %:fieldSearch% OR p.barcode LIKE %:fieldSearch%)",
            countQuery = "SELECT COUNT(*) FROM Products p WHERE (:fieldSearch IS NULL OR p.name LIKE %:fieldSearch% OR p.sku LIKE %:fieldSearch% OR p.barcode LIKE %:fieldSearch%)",
            nativeQuery = true)
    Page<Product> searchProducts(String fieldSearch, Pageable pageable);

    @Query(value = """
                SELECT 
                    p.product_id as product_id,
                    p.sku as sku,
                    p.name as name,
                    p.description as description,
                    p.uom as uom,
                    p.purchase_price as purchase_price,
                    p.selling_price as selling_price,
                    p.status as status,
                    p.barcode as barcode,
                    p.image_url as image_url,
                    p.created_at as created_at,
                    p.updated_at as updated_at,
                    p.created_by as created_by,
                    p.updated_by as updated_by,
                    p.deleted_at as deleted_at,
                    c.category_id as category_id,
                    c.name as name,
                    c.deleted_at as deleted_at
                FROM products p
                LEFT JOIN product_categories c 
                    ON p.category_id = c.category_id
                WHERE p.product_id = :id
            """, nativeQuery = true)
    Product findProductById(Integer id);

    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM Products WHERE barcode = :barcode", nativeQuery = true)
    boolean existsBarcode(String barcode);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.sku = :sku")
    boolean existsBySku(@Param("sku") String sku);
}
