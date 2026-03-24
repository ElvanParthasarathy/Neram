import React from 'react';
import AcademicTree from './AcademicTree';

const StructureManager = () => {
  return (
    <div className="admin-subpage animate-fade-in structure-manager-main" style={{ padding: '0px' }}>
      <div className="manager-content">
        <AcademicTree />
      </div>

      <style>{`
        .structure-manager-main {
            width: 100%;
        }
        .manager-content {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        @media (max-width: 768px) {
            .manager-content {
                padding: 0 16px;
            }
        }
      `}</style>
    </div>
  );
};

export default StructureManager;
