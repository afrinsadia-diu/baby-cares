/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/label-has-associated-control */
/** @format */
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuth from '../../Hooks/useAuth';

const AddService = () => {
    const { user, token } = useAuth();
    const [status, setStatus] = useState(false);
    const [uploading, SetUploading] = useState(false);
    const [image, SetImage] = useState('');
    const { register, handleSubmit, reset } = useForm();
    const [product, setProduct] = useState({
        pic: '',
        name: '',
        price: '',
        description: '',
    });
    const onSubmit = (data) => {
        console.log(data);
        const newProduct = { ...product };
        axios
            .post(
                `${process.env.REACT_APP_BACKEND_URL}/product`,
                {
                    ...newProduct,
                },
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                        'content-type': 'application/json',
                        email: user?.email,
                    },
                }
            )
            .then((res) => {
                if (res.data.insertedId) {
                    setStatus(!status);
                    setProduct({ ...product, pic: '', name: '', price: '', description: '' });
                    reset();
                }
            });
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        SetUploading(true);

        try {
            const config = {
                headers: {
                    authorization: `Bearer ${token}`,
                    'content-type': 'application/json',
                    email: user?.email,
                },
            };
            const { data } = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/image-upload`,
                formData,
                config
            );
            setProduct({ ...product, pic: data.result.secure_url });
            SetUploading(false);
        } catch (error) {
            console.error(error);
            SetUploading(false);
        }
    };
    const handleInputValue = (e) => {
        const newProduct = { ...product };
        newProduct[e.target.name] = e.target.value;
        setProduct(newProduct);
    };

    return (
        <div className="admin-add-event">
            <h5 className="display-5 py-md-4 py-0">Add Product</h5>
            {status && (
                <div className="alert alert-success text-center" role="alert">
                    New Product added successfully
                </div>
            )}
            <div className="admin-content">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <label htmlFor="Prcie">Image</label>
                    <input
                        name="pic"
                        value={product.pic}
                        required
                        onChange={handleInputValue}
                        placeholder="add Image url or upload image"
                        className="form-control mt-2"
                    />
                    <br />
                    <label htmlFor="Prcie">Upload Image 1 MB maximum size</label>
                    <input
                        type="file"
                        placeholder="Image url"
                        className="form-control mt-2"
                        onChange={uploadFileHandler}
                    />
                    <br />
                    {uploading && <CircularProgress />}
                    <label htmlFor="Name">Name</label>
                    <br />
                    <input
                        name="name"
                        value={product.name}
                        required
                        onChange={handleInputValue}
                        placeholder="Name"
                        className="form-control mt-2"
                    />

                    <label htmlFor="price">Price</label>
                    <br />
                    <input
                        name="price"
                        value={product.price}
                        required
                        onChange={handleInputValue}
                        placeholder="Price"
                        className="form-control mt-2"
                    />
                    <label htmlFor="Prcie">Description</label>
                    <br />
                    <input
                        type="text"
                        name="description"
                        value={product.description}
                        required
                        onChange={handleInputValue}
                        placeholder="Description"
                        className="form-control mt-2"
                    />
                    <br />
                    <input type="submit" className="btn btn-primary mt-4" />
                </form>
            </div>
        </div>
    );
};

export default AddService;
