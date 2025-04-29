import React from 'react';

const EditableCell = ({ value, isEditing, onChange }) => {
  if (isEditing) {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 border rounded"
      />
    );
  }
  
  return <span>{value}</span>;
};

export default EditableCell;