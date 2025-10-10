import React, { useState } from 'react';
import type { AlleleData } from '../types';

interface AlleleReferenceTableProps {
  alleleData: AlleleData[];
  onUpdate?: (data: AlleleData[]) => void;
}

export const AlleleReferenceTable: React.FC<AlleleReferenceTableProps> = ({
  alleleData,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<AlleleData | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...alleleData[index] });
  };

  const handleSave = () => {
    if (editingIndex !== null && editData && onUpdate) {
      const newData = [...alleleData];
      newData[editingIndex] = editData;
      onUpdate(newData);
    }
    setEditingIndex(null);
    setEditData(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  return (
    <div className="allele-reference-table">
      <div className="accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          {isExpanded ? '▼' : '▶'} Allele Reference Table
          <span className="entry-count">({alleleData.length} entries)</span>
        </h3>
      </div>

      {isExpanded && (
        <div className="table-container">
          <p className="table-description">
            This table shows the wild (common/reference) and problem (risk/variant) alleles
            for each RS ID. Click the confirmation URL to verify the allele designations.
          </p>

          <table>
            <thead>
              <tr>
                <th>RS ID</th>
                <th>Wild Allele</th>
                <th>Problem Allele</th>
                <th>Confirmation URL</th>
                {onUpdate && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {alleleData.map((item, index) => (
                <tr key={index}>
                  {editingIndex === index && editData ? (
                    <>
                      <td>
                        <input
                          value={editData.rsId}
                          onChange={(e) => setEditData({ ...editData, rsId: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={editData.wildAllele}
                          onChange={(e) => setEditData({ ...editData, wildAllele: e.target.value })}
                          maxLength={1}
                        />
                      </td>
                      <td>
                        <input
                          value={editData.problemAllele}
                          onChange={(e) => setEditData({ ...editData, problemAllele: e.target.value })}
                          maxLength={1}
                        />
                      </td>
                      <td>
                        <input
                          value={editData.confirmationUrl}
                          onChange={(e) => setEditData({ ...editData, confirmationUrl: e.target.value })}
                        />
                      </td>
                      {onUpdate && (
                        <td>
                          <button onClick={handleSave} className="btn-save">Save</button>
                          <button onClick={handleCancel} className="btn-cancel">Cancel</button>
                        </td>
                      )}
                    </>
                  ) : (
                    <>
                      <td><strong>{item.rsId}</strong></td>
                      <td>{item.wildAllele}</td>
                      <td>{item.problemAllele}</td>
                      <td>
                        <a href={item.confirmationUrl} target="_blank" rel="noopener noreferrer">
                          Verify
                        </a>
                      </td>
                      {onUpdate && (
                        <td>
                          <button onClick={() => handleEdit(index)} className="btn-edit">Edit</button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
