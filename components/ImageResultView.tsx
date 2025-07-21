import React from 'react';

// This component is not used as the feature has been removed.
// It is kept as an empty shell to prevent build errors.
const ImageResultView: React.FC = () => {
    return (
        <div className="p-8 text-center glass-card rounded-2xl">
            <h2 className="text-2xl font-bold text-yellow-300">Feature Not Available</h2>
            <p className="mt-2 text-gray-300">The AI Image Generation feature has been removed.</p>
        </div>
    );
};

export default ImageResultView;