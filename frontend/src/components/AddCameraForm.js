import React, { useState } from 'react';

const AddCameraForm = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [rtspUrl, setRtspUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({ name, rtspUrl });
        setName('');
        setRtspUrl('');
    };

    return ( <
        form onSubmit = { handleSubmit } >
        <
        input type = "text"
        placeholder = "Camera Name"
        value = { name }
        onChange = {
            (e) => setName(e.target.value) }
        /> <
        input type = "text"
        placeholder = "RTSP URL"
        value = { rtspUrl }
        onChange = {
            (e) => setRtspUrl(e.target.value) }
        /> <
        button type = "submit" > Add Camera < /button> <
        /form>
    );
};

export default AddCameraForm;