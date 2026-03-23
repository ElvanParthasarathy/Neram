import React, { useState } from 'react';
import AcademicTree from './AcademicTree';
import FacultyDirectory from './FacultyDirectory';

// Icons
import { RiOrganizationChart, RiGroupLine } from 'react-icons/ri';

const StructureManager = () => {
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' or 'faculty'

  return (
    <div className="admin-subpage animate-fade-in structure-manager-main" style={{ padding: '0px' }}>
      {/* Top Pill Switcher - Aligned Left Like Calendar */}
      <div className="tab-switcher-wrapper">
        <nav className="editor-tabs box-flat" style={{ marginBottom: 0 }}>
          <button 
            className={activeTab === 'tree' ? 'active' : ''}
            onClick={() => setActiveTab('tree')}
          >
             Live Tree
          </button>
          <button 
            className={activeTab === 'faculty' ? 'active' : ''}
            onClick={() => setActiveTab('faculty')}
          >
             Faculty Directory
          </button>
        </nav>
      </div>

      {/* View Content */}
      <div className="manager-content">
        {activeTab === 'tree' ? <AcademicTree /> : <FacultyDirectory />}
      </div>

      <style>{`
        .structure-manager-main {
            width: 100%;
        }
        .tab-switcher-wrapper {
            display: flex;
            justify-content: flex-start;
            margin-top: 10px;
            margin-bottom: 40px;
            padding: 0;
        }
        .manager-content {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        @media (max-width: 768px) {
            .tab-switcher-wrapper {
                display: flex;
                justify-content: center;
                padding: 0 20px;
                margin-top: 0;
                margin-bottom: 24px;
            }
            .manager-content {
                padding: 0 16px;
            }
        }
      `}</style>
    </div>
  );
};

export default StructureManager;
