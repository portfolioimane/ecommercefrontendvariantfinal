import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../axios'; // Import your Axios instance
import { useNavigate } from 'react-router-dom'; // Use useNavigate for navigation
import { SketchPicker } from 'react-color'; // Import SketchPicker for color picking
import './VariantCreate.css'; // Import your custom CSS for styling

const VariantCreate = () => {
    const navigate = useNavigate(); // Use useNavigate for navigation

    const [formData, setFormData] = useState({
        color: '#000000', // Default color
        size: '',
        price_adjustment: 0,
        image_url: '',
        product_id: '' // Add product_id to form data
    });
    const [image, setImage] = useState(null); // State for image file
    const [products, setProducts] = useState([]); // State for product list
    const [error, setError] = useState(null);

    // Fetch available products when component mounts
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axiosInstance.get('/api/admin/products');
                setProducts(response.data); // Assuming the API returns an array of products
            } catch (err) {
                setError('Failed to load products.');
            }
        };

        fetchProducts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleColorChange = (color) => {
        setFormData((prevData) => ({
            ...prevData,
            color: color.hex,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        setFormData((prevData) => ({
            ...prevData,
            image_url: URL.createObjectURL(file) // Temporarily store image URL
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSubmit = new FormData();

        // Append form data
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSubmit.append(key, value);
        });

        // Append image if it exists
        if (image) {
            formDataToSubmit.append('image', image);
        }

        try {
            await axiosInstance.post(`/api/admin/variants/create`, formDataToSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for image upload
                },
            });
            navigate('/admin/variants'); // Redirect after successful creation
        } catch (err) {
            setError('Failed to create the variant.');
        }
    };

    return (
        <div className="create-variant-container">
            <h2>Create New Product Variant</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit} className="create-variant-form">
                <div className="form-group">
                    <label>Product:</label>
                    <select 
                        name="product_id" 
                        value={formData.product_id} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Select a Product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Color:</label>
                    <SketchPicker 
                        color={formData.color} 
                        onChange={handleColorChange} 
                    />
                    <div 
                        className="color-swatch" 
                        style={{ backgroundColor: formData.color }} 
                    />
                </div>
                <div className="form-group">
                    <label>Size:</label>
                    <input 
                        type="text" 
                        name="size" 
                        value={formData.size} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Price Adjustment:</label>
                    <input 
                        type="number" 
                        name="price_adjustment" 
                        value={formData.price_adjustment} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Image Upload:</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                    />
                    {formData.image_url && (
                        <img 
                            src={formData.image_url} 
                            alt="Variant Preview" 
                            className="image-preview" 
                        />
                    )}
                </div>
                <button type="submit" className="submit-button">Create Variant</button>
            </form>
        </div>
    );
};

export default VariantCreate;
