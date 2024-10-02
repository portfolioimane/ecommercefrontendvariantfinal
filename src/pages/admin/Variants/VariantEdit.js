import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../axios'; // Import your Axios instance
import { useParams, useNavigate } from 'react-router-dom'; // Use useNavigate for navigation
import { SketchPicker } from 'react-color'; // Import SketchPicker for color picking
import './VariantEdit.css'; // Import your custom CSS for styling

const VariantEdit = () => {
    const { id } = useParams(); // Get the variant ID from the URL
    const navigate = useNavigate(); // Use useNavigate for navigation

    const [variant, setVariant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        color: '#000000', // Default color
        size: '',
        price_adjustment: 0,
        image_url: ''
    });
    const [image, setImage] = useState(null); // State for image file

    useEffect(() => {
        const fetchVariant = async () => {
            try {
                const response = await axiosInstance.get(`/api/admin/variants/${id}`);
                setVariant(response.data);
                setFormData({
                    color: response.data.color || '#000000',
                    size: response.data.size || '',
                    price_adjustment: response.data.price_adjustment || 0,
                    image_url: response.data.image_url || '' // Load existing image URL
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVariant();
    }, [id]); // Fetch variant data on component mount

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

        // Append method to indicate PUT
        formDataToSubmit.append('_method', 'PUT');

        try {
            await axiosInstance.post(`/api/admin/variants/edit/${id}`, formDataToSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for image upload
                },
            });
            navigate('/admin/variants'); // Redirect after successful update
        } catch (err) {
            setError('Failed to update the variant.');
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="edit-variant-container">
            {variant && (
                <div className="variant-info">
                    <h2>Editing Product Variant</h2>
                    <p>Product: {variant.product?.name}</p> {/* Safely access product name */}
                </div>
            )}
            <form onSubmit={handleSubmit} className="edit-variant-form">
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
                            src={`${process.env.REACT_APP_API_URL}/storage/${formData.image_url}`} // Correctly pointing to existing image
                            alt="Variant Preview" 
                            className="image-preview" 
                        />
                    )}
                </div>
                <button type="submit" className="submit-button">Update Variant</button>
            </form>
        </div>
    );
};

export default VariantEdit;
