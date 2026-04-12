import React, { useState, useEffect } from 'react';
import { Play, Trash2 } from 'lucide-react';
import { API } from '../lib/api';

const STAGES = ['Pending', 'Frame-work', 'Carving', 'Sanding', 'Polishing', 'Fitting', 'Finished'];

function ManufacturingStages() {
  const [jobs, setJobs] = useState([]);
  const [newJobName, setNewJobName] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    fetch(`${API}/api/jobs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setJobs(data);
        else setJobs([
          { id: 'JOB-909', product: '(Mock) Royal Bed', stage: 'Polishing', is_completed: false },
          { id: 'JOB-910', product: '(Mock) Dining Table', stage: 'Pending', is_completed: false }
        ]);
      })
      .catch(err => {
        setJobs([
          { id: 'JOB-909', product: '(Mock) Royal Bed', stage: 'Polishing', is_completed: false },
          { id: 'JOB-910', product: '(Mock) Dining Table', stage: 'Pending', is_completed: false }
        ]);
      });
  };

  const createJob = async () => {
    if(!newJobName) return;
    const jobId = `JOB-${Math.floor(Math.random() * 10000)}`;
    await fetch(`${API}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jobId, product: newJobName })
    });
    setNewJobName('');
    fetchJobs();
  };

  const advanceStage = async (id, currentStage) => {
    const currentIndex = STAGES.indexOf(currentStage);
    if(currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      await fetch(`${API}/api/jobs/${id}/advance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage })
      });
      fetchJobs();
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await fetch(`${API}/api/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch(e) { console.error(e); }
  };

  const getStageColor = (stage) => {
    if(stage === 'Finished') return 'bg-green-100 text-green-700 border-green-200';
    if(stage === 'Polishing' || stage === 'Fitting') return 'bg-orange-100 text-orange-700 border-orange-200';
    if(stage === 'Pending') return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div>
          <h5 className="font-semibold text-gray-800 text-lg">Active Jobs</h5>
          <p className="text-gray-500 text-sm">Monitor production progress on the factory floor</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="w-48 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 transition-colors outline-none text-sm" 
            placeholder="New Product Name"
            value={newJobName}
            onChange={(e) => setNewJobName(e.target.value)}
          />
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors" onClick={createJob}>
            + Add Job
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jobs.length === 0 && <p className="text-gray-500 italic p-4">No jobs in pipeline.</p>}
        {jobs.map(job => (
          <div key={job.id} className={`p-5 rounded-xl border transition-all ${job.is_completed ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-blue-100 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] hover:shadow-lg hover:-translate-y-0.5'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="font-bold text-gray-900 text-lg">{job.product}</h6>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{job.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStageColor(job.stage)}`}>
                  {job.stage}
                </span>
                <button onClick={() => handleDelete(job.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(STAGES.indexOf(job.stage) / (STAGES.length - 1)) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-gray-400 w-8 text-right">
                {Math.round((STAGES.indexOf(job.stage) / (STAGES.length - 1)) * 100)}%
              </span>
            </div>
            
            {!job.is_completed && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => advanceStage(job.id, job.stage)} 
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Advance Stage
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManufacturingStages;
