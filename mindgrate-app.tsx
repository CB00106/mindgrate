import React, { useState } from 'react';

function Sidebar({ currentPage, setPage }) {
  const menu = [
    { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'Hub', label: 'Hub', icon: '💬' },
    { key: 'Agent', label: 'Agent Builder', icon: '🤖' },
    { key: 'Data', label: 'Data Sources', icon: '📁' },
    { key: 'Settings', label: 'Settings', icon: '⚙️' },
  ];
  
  return (
    <aside className="w-60 bg-gray-800 text-white p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <span className="text-blue-400 mr-2">🧠</span> Mindgrate
      </h1>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menu.map(item => (
            <li key={item.key}>
              <button
                onClick={() => setPage(item.key)}
                className={`w-full text-left p-3 rounded flex items-center ${
                  currentPage === item.key 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center p-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            JD
          </div>
          <div className="ml-2">
            <div className="text-sm">John Doe</div>
            <div className="text-xs text-gray-400">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Dashboard() {
  const stats = [
    { title: 'Active Agents', value: 12, change: '+3', color: 'bg-blue-500' },
    { title: 'Messages Today', value: 1432, change: '+24%', color: 'bg-green-500' },
    { title: 'Data Sources', value: 8, change: '+1', color: 'bg-purple-500' },
    { title: 'API Calls', value: '28.5k', change: '-2%', color: 'bg-yellow-500' },
  ];
  
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className={`w-10 h-10 rounded-full ${stat.color} mb-3 flex items-center justify-center text-white`}>
              {index === 0 && '🤖'}
              {index === 1 && '💬'}
              {index === 2 && '📁'}
              {index === 3 && '📈'}
            </div>
            <h3 className="text-gray-500 text-sm">{stat.title}</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className={`ml-2 text-sm ${stat.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span> Agent Performance
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-400">Performance chart visualization</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <span className="mr-2">⏱️</span> Recent Activities
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-center border-b border-gray-100 pb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  {i % 3 === 0 && '🤖'}
                  {i % 3 === 1 && '📁'}
                  {i % 3 === 2 && '⚙️'}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    {i % 3 === 0 && 'New agent "Content Creator" added'}
                    {i % 3 === 1 && 'Connected to Salesforce API'}
                    {i % 3 === 2 && 'System settings updated'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {i * 12} minutes ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hub() {
  const [chat, setChat] = useState([
    { from: 'agent', text: 'Hello! How can I help you today?' },
    { from: 'user', text: 'Can you help me analyze these project metrics?' },
    { from: 'agent', text: 'Of course! I can analyze your project metrics. Please provide the data or tell me which metrics you\'d like to focus on.' },
  ]);

  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('Project Analyst');
  
  const agents = [
    'Project Analyst',
    'Risk Manager',
    'Resource Planner',
    'Budget Monitor',
    'Timeline Optimizer'
  ];

  const sendMessage = e => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    setChat(prev => [...prev, { from: 'user', text: input }]);
    
    // Simulate agent response
    setTimeout(() => {
      setChat(prev => [...prev, { 
        from: 'agent', 
        text: `I'm analyzing your request: "${input}" as the ${selectedAgent} agent.` 
      }]);
    }, 1000);
    
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            🤖
          </div>
          <div className="ml-3">
            <select 
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="font-semibold bg-transparent border-none focus:ring-0"
            >
              {agents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
            <div className="text-xs text-green-500 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Online
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="p-2 rounded hover:bg-gray-100">
            <span className="text-gray-500">📋</span>
          </button>
          <button className="p-2 rounded hover:bg-gray-100">
            <span className="text-gray-500">⚙️</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {chat.map((msg, i) => (
          <div key={i} className={`flex mb-4 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                🤖
              </div>
            )}
            <div 
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                msg.from === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
            {msg.from === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 mt-1">
                👤
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full border border-gray-300 rounded-full p-3 pr-10"
              placeholder="Type your message..."
            />
            <button type="button" className="absolute right-3 top-3 text-gray-400">
              📎
            </button>
          </div>
          <button 
            type="submit" 
            className={`rounded-full w-12 h-12 flex items-center justify-center ${
              input.trim() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            📤
          </button>
        </form>
      </div>
    </div>
  );
}

function Agent() {
  const [formData, setFormData] = useState({
    name: 'Project Analyst',
    role: 'Analysis', 
    description: 'This agent analyzes project metrics and provides insights on project performance.', 
    prompt_template: '{{input}} - Analyze this from a project management perspective.', 
    temperature: 0.7,
    max_tokens: 512, 
    verbosity_level: 'Medium', 
    enabled: true, 
    tags: ['ProjectManagement', 'Analysis'],
    data_sources: ['ProjectDB', 'TimeTracking'], 
    retry_on_fail: true, 
    rate_limit_per_minute: 60,
    model: 'gpt-4'
  });

  const roles = ['Analysis', 'Planning', 'Risk Management', 'Resource Allocation', 'Reporting'];
  const verbosityOptions = ['Low', 'Medium', 'High'];
  const availableTags = ['ProjectManagement', 'Analysis', 'Planning', 'Budget', 'QA', 'Sprint', 'Risk'];
  const availableDataSources = ['ProjectDB', 'TimeTracking', 'Budget', 'External API', 'Logs', 'CRM'];
  const models = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro'];
  
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelect = (e, field) => {
    const { options } = e.target;
    const values = Array.from(options).filter(opt => opt.selected).map(opt => opt.value);
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    alert('Agent configuration saved!');
    console.log('Saving', formData);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Agent Configuration</h2>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-500">{formData.enabled ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role / Function</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a role</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
              placeholder="What does this agent do?"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    name="enabled"
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2">Agent enabled</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
            <textarea
              name="prompt_template"
              value={formData.prompt_template}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="{{input}}"
            />
            <p className="mt-1 text-sm text-gray-500">Use {{input}} as placeholder for user input</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {formData.temperature}
              </label>
              <input
                name="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input
                name="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verbosity Level</label>
              <div className="mt-1 flex space-x-4">
                {verbosityOptions.map(opt => (
                  <label key={opt} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="verbosity_level"
                      value={opt}
                      checked={formData.verbosity_level === opt}
                      onChange={handleChange}
                      className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <select
                multiple
                name="tags"
                value={formData.tags}
                onChange={e => handleMultiSelect(e, 'tags')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-24"
              >
                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Sources</label>
              <select
                multiple
                name="data_sources"
                value={formData.data_sources}
                onChange={e => handleMultiSelect(e, 'data_sources')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-24"
              >
                {availableDataSources.map(ds => <option key={ds} value={ds}>{ds}</option>)}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-3">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (per min)</label>
                <input
                  name="rate_limit_per_minute"
                  type="number"
                  value={formData.rate_limit_per_minute}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  name="retry_on_fail"
                  type="checkbox"
                  checked={formData.retry_on_fail}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <label className="ml-2">Retry on failure</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Reset
            </button>
            <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Test Agent
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Data() {
  const dataSources = [
    { name: 'Project Database', type: 'SQL Database', status: 'Connected', lastSync: '2 minutes ago' },
    { name: 'Google Sheets - Budget', type: 'Google Sheets', status: 'Connected', lastSync: '10 minutes ago' },
    { name: 'Salesforce', type: 'API', status: 'Error', lastSync: '1 hour ago' },
    { name: 'Customer Data', type: 'CSV Upload', status: 'Connected', lastSync: '3 days ago' },
  ];
  
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Data Sources</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
          <span className="mr-2">+</span> Add Data Source
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {dataSources.map((source, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 flex">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
              {source.type === 'Google Sheets' && '📊'}
              {source.type === 'SQL Database' && '💾'}
              {source.type === 'API' && '🔌'}
              {source.type === 'CSV Upload' && '📁'}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{source.name}</h3>
              <div className="text-sm text-gray-500">{source.type}</div>
              <div className="flex items-center mt-2">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  source.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-xs">{source.status} • Last sync: {source.lastSync}</span>
              </div>
            </div>
            <div>
              <button className="text-gray-400 hover:text-gray-600">⚙️</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Connect New Data Source</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4 flex flex-col items-center hover:bg-blue-50 hover:border-blue-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              📊
            </div>
            <div className="font-medium">Google Sheets</div>
          </div>
          
          <div className="border rounded-lg p-4 flex flex-col items-center hover:bg-blue-50 hover:border-blue-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              💾
            </div>
            <div className="font-medium">Database</div>
          </div>
          
          <div className="border rounded-lg p-4 flex flex-col items-center hover:bg-blue-50 hover:border-blue-300 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              🔌
            </div>
            <div className="font-medium">API</div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Google Sheets Connection</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet URL</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name (optional)</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Sheet1"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">First row contains headers</label>
            </div>
            
            <div className="pt-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Connect to Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>
      
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex flex-wrap">
            <button 
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'general' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'api' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              API Keys
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'users' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'notifications' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Application Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue="Mindgrate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Default Agent Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Model</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue="gpt-4"
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Max Tokens</label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue="512"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Theme Settings</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      defaultChecked
                      className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2">Light</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2">Dark</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2">System</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">API Keys</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">OpenAI</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">sk-••••••••••••••••••••</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 week ago</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Anthropic</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">sk-ant-••••••••••••••</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3 days ago</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Add New API Key
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">User Management</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">John Doe</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">john@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Admin</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Jane Smith</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">jane@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Editor</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Add New User
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive email alerts for important events</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" id="toggle-email" defaultChecked className="sr-only" />
                      <label htmlFor="toggle-email" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-0 transition-transform duration-200 ease-in"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Agent Error Alerts</h4>
                      <p className="text-sm text-gray-500">Be notified when agents encounter errors</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" id="toggle-errors" defaultChecked className="sr-only" />
                      <label htmlFor="toggle-errors" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-0 transition-transform duration-200 ease-in"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Weekly Reports</h4>
                      <p className="text-sm text-gray-500">Get weekly usage and performance reports</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" id="toggle-reports" className="sr-only" />
                      <label htmlFor="toggle-reports" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-0 transition-transform duration-200 ease-in"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('Dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={page} setPage={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {page === 'Dashboard' && <Dashboard />}
        {page === 'Hub' && <Hub />}
        {page === 'Agent' && <Agent />}
        {page === 'Data' && <Data />}
        {page === 'Settings' && <Settings />}
      </div>
    </div>
  );
}