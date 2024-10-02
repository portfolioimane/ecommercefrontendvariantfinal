import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../axios'; // Import your Axios instance
import './VariantList.css'; // Import your CSS file for styling
import { Link } from 'react-router-dom'; // Import for routing

const VariantList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProductsWithVariants = async () => {
            try {
                const response = await axiosInstance.get('/api/admin/variants'); // Fetch products with variants
                setProducts(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsWithVariants();
    }, []); // Empty dependency array to run on component mount

    const handleDelete = async (variantId) => {
        if (window.confirm('Are you sure you want to delete this variant?')) {
            try {
                await axiosInstance.delete(`/api/admin/variants/${variantId}`); // Delete the variant
                // Update the state to remove the deleted variant from the products state
                setProducts((prevProducts) => 
                    prevProducts.map(product => ({
                        ...product,
                        variants: product.variants.filter(variant => variant.id !== variantId)
                    }))
                );
            } catch (err) {
                setError('Failed to delete the variant.'); // Handle any errors
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Filter out products without variants
    const productsWithVariants = products.filter(product => product.variants.length > 0);

    return (
        <div className="variant-list-container">
            <h1 className="page-title">Product Variants</h1>
            {productsWithVariants.length === 0 ? (
                <div>No products with variants available.</div>
            ) : (
                <table className="variant-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Description</th>
                            <th>Color</th>
                            <th>Size</th>
                            <th>Price Adjustment</th>
                            <th>Total Price</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsWithVariants.map((product) =>
                            product.variants.map((variant, index) => (
                                <tr key={variant.id}>
                                    {index === 0 ? (
                                        <>
                                            <td rowSpan={product.variants.length}>{product.name}</td>
                                            <td rowSpan={product.variants.length}>{product.description}</td>
                                            <td>
                                                {variant.color ? (
                                                    <div 
                                                        className="color-circle" 
                                                        style={{ backgroundColor: variant.color, width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block' }} 
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>{variant.size || 'N/A'}</td>
                                            <td>{Number(variant.price_adjustment).toFixed(2)}</td>
                                            <td>
                                                {(Number(product.price) + Number(variant.price_adjustment)).toFixed(2)}
                                            </td>
                                            <td>
                                                <img src={`${process.env.REACT_APP_API_URL}/storage/${variant.image_url}`} alt={variant.color} className="variant-image" />
                                            </td>
                                            <td>
                                                <Link to={`/admin/variant/edit/${variant.id}`} className="edit-button">
                                                    Edit
                                                </Link>
                                                <button
                                                    className="remove-button"
                                                    onClick={() => handleDelete(variant.id)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                {variant.color ? (
                                                    <div 
                                                        className="color-circle" 
                                                        style={{ backgroundColor: variant.color, width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block' }} 
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>{variant.size || 'N/A'}</td>
                                            <td>{Number(variant.price_adjustment).toFixed(2)}</td>
                                            <td>
                                                {(Number(product.price) + Number(variant.price_adjustment)).toFixed(2)}
                                            </td>
                                            <td>
                                                <img src={`${process.env.REACT_APP_API_URL}/storage/${variant.image_url}`} alt={variant.image_url} className="variant-image" />
                                            </td>
                                            <td>
                                                <Link to={`/admin/variant/edit/${variant.id}`} className="edit-button">
                                                    Edit
                                                </Link>
                                                <button
                                                    className="remove-button"
                                                    onClick={() => handleDelete(variant.id)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default VariantList;
