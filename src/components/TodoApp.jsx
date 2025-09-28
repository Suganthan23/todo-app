import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useLocalStorage from '../hooks/useLocalStorage';

const TodoApp = () => {
    const [todos, setTodos] = useLocalStorage('todos', []);
    const [inputValue, setInputValue] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [showLoadMessage, setShowLoadMessage] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [newTodoPriority, setNewTodoPriority] = useState('medium');
    const [newTodoCategory, setNewTodoCategory] = useState('personal');
    const [newTodoDueDate, setNewTodoDueDate] = useState('');
    const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);

    const categories = [
        { id: 'personal', name: 'Personal', color: 'bg-blue-100 text-blue-800' },
        { id: 'work', name: 'Work', color: 'bg-purple-100 text-purple-800' },
        { id: 'shopping', name: 'Shopping', color: 'bg-green-100 text-green-800' },
        { id: 'health', name: 'Health', color: 'bg-pink-100 text-pink-800' },
        { id: 'learning', name: 'Learning', color: 'bg-yellow-100 text-yellow-800' },
    ];

    useEffect(() => {
        if (todos.length > 0) {
            setShowLoadMessage(true);
            const timer = setTimeout(() => setShowLoadMessage(false), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const filteredAndSortedTodos = React.useMemo(() => {
        let filtered = todos;

        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(todo =>
                todo.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(todo => {
                if (filterStatus === 'active') return !todo.completed;
                if (filterStatus === 'completed') return todo.completed;
                if (filterStatus === 'overdue') {
                    return !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date();
                }
                return true;
            });
        }

        if (filterPriority !== 'all') {
            filtered = filtered.filter(todo => todo.priority === filterPriority);
        }

        if (filterCategory !== 'all') {
            filtered = filtered.filter(todo => todo.category === filterCategory);
        }

        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'alphabetical':
                    return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [todos, searchTerm, filterStatus, filterPriority, filterCategory, sortBy]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(filteredAndSortedTodos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update the order in the original todos array
        const newTodos = todos.map(todo => {
            const newIndex = items.findIndex(item => item.id === todo.id);
            return newIndex !== -1 ? { ...todo, order: newIndex } : todo;
        });

        setTodos(newTodos);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterPriority('all');
        setFilterCategory('all');
        setSortBy('newest');
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddTodo = () => {
        if (inputValue.trim() !== '') {
            const newTodo = {
                id: Date.now(),
                text: inputValue,
                completed: false,
                priority: newTodoPriority,
                category: newTodoCategory,
                dueDate: newTodoDueDate || null,
                createdAt: new Date().toISOString(),
                order: todos.length
            };

            setTodos([...todos, newTodo]);
            setInputValue('');
            setNewTodoDueDate('');
        }
    };

    const handleToggleTodo = (id) => {
        setTodos(todos.map(todo => {
            if (todo.id === id) {
                return {
                    ...todo,
                    completed: !todo.completed,
                    completedAt: !todo.completed ? new Date().toISOString() : null
                };
            }
            return todo;
        }));
    };

    const handleDeleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    const handleStartEdit = (id, currentText) => {
        setEditingId(id);
        setEditingText(currentText);
    };

    const handleSaveEdit = (id) => {
        if (editingText.trim() !== '') {
            setTodos(todos.map(todo => {
                if (todo.id === id) {
                    return { ...todo, text: editingText.trim() };
                }
                return todo;
            }));
        }
        setEditingId(null);
        setEditingText('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingText('');
    };

    const handlePriorityChange = (id, newPriority) => {
        setTodos(todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, priority: newPriority };
            }
            return todo;
        }));
    };

    const handleCategoryChange = (id, newCategory) => {
        setTodos(todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, category: newCategory };
            }
            return todo;
        }));
    };

    const handleDueDateChange = (id, newDueDate) => {
        setTodos(todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, dueDate: newDueDate || null };
            }
            return todo;
        }));
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all todos?')) {
            setTodos([]);
        }
    };

    const handleClearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify(todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedTodos = JSON.parse(e.target.result);
                    if (Array.isArray(importedTodos)) {
                        setTodos(importedTodos);
                        alert('Todos imported successfully!');
                    } else {
                        alert('Invalid file format');
                    }
                } catch (error) {
                    alert('Error reading file');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddTodo();
        }
    };

    const handleEditKeyPress = (e, id) => {
        if (e.key === 'Enter') {
            handleSaveEdit(id);
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
            default: return 'border-gray-300 bg-white dark:bg-gray-800';
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    const getCategoryInfo = (categoryId) => {
        return categories.find(cat => cat.id === categoryId) || categories[0];
    };

    const isOverdue = (dueDate) => {
        return dueDate && new Date(dueDate) < new Date() && !todos.find(t => t.dueDate === dueDate)?.completed;
    };

    const getDueDateStatus = (dueDate, completed) => {
        if (!dueDate || completed) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
        if (diffDays === 0) return { status: 'today', text: 'Due today', color: 'text-orange-600' };
        if (diffDays === 1) return { status: 'tomorrow', text: 'Due tomorrow', color: 'text-yellow-600' };
        if (diffDays <= 7) return { status: 'week', text: `Due in ${diffDays} days`, color: 'text-blue-600' };
        return { status: 'future', text: `Due ${due.toLocaleDateString()}`, color: 'text-gray-600' };
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header with Dark Mode Toggle */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        My Todo App
                    </h1>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>

                {showLoadMessage && todos.length > 0 && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
                        ✅ Loaded {todos.length} todos from your previous session!
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Add a new todo..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={newTodoPriority}
                                onChange={(e) => setNewTodoPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={newTodoCategory}
                                onChange={(e) => setNewTodoCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date (Optional)</label>
                            <input
                                type="date"
                                value={newTodoDueDate}
                                onChange={(e) => setNewTodoDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleAddTodo}
                                className="w-full btn-primary"
                            >
                                Add Todo
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                        <button
                            onClick={handleClearCompleted}
                            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
                            disabled={todos.filter(todo => todo.completed).length === 0}
                        >
                            Clear Completed
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                            disabled={todos.length === 0}
                        >
                            Clear All
                        </button>
                        <button
                            onClick={handleExportData}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                            disabled={todos.length === 0}
                        >
                            Export Data
                        </button>
                        <label className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer">
                            Import Data
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportData}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search & Filter</h3>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search todos..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">All Todos</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">All Priorities</option>
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="priority">Priority</option>
                                <option value="alphabetical">Alphabetical</option>
                                <option value="dueDate">Due Date</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleClearFilters}
                                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('overdue')}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800"
                        >
                            🚨 Overdue
                        </button>
                        <button
                            onClick={() => { setFilterPriority('high'); setFilterStatus('active'); }}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800"
                        >
                            🔥 High Priority
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                            ⏳ Active Tasks
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-sm hover:bg-green-200 dark:hover:bg-green-800"
                        >
                            ✅ Completed
                        </button>
                    </div>

                    {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all') && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <div className="text-sm text-blue-700 dark:text-blue-200">
                                Showing {filteredAndSortedTodos.length} of {todos.length} todos
                                {searchTerm && <span> matching "{searchTerm}"</span>}
                                {filterStatus !== 'all' && <span> • Status: {filterStatus}</span>}
                                {filterPriority !== 'all' && <span> • Priority: {filterPriority}</span>}
                                {filterCategory !== 'all' && <span> • Category: {getCategoryInfo(filterCategory).name}</span>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    {filteredAndSortedTodos.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            {todos.length === 0 ? (
                                <>
                                    <div className="text-4xl mb-4">📝</div>
                                    <div className="text-lg mb-2">No todos yet!</div>
                                    <div className="text-sm">Add one above or import your existing todos.</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-4xl mb-4">🔍</div>
                                    <div className="text-lg mb-2">No todos match your filters</div>
                                    <div className="text-sm mb-4">
                                        Try adjusting your search term or filters above.
                                    </div>
                                    <button
                                        onClick={handleClearFilters}
                                        className="btn-secondary"
                                    >
                                        Clear All Filters
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                                        ? `Filtered Todos (${filteredAndSortedTodos.length})`
                                        : `Your Todos (${todos.length})`
                                    }
                                </h2>

                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Sorted by: {sortBy === 'newest' ? 'Newest First' :
                                        sortBy === 'oldest' ? 'Oldest First' :
                                            sortBy === 'priority' ? 'Priority' :
                                                sortBy === 'dueDate' ? 'Due Date' : 'Alphabetical'}
                                </div>
                            </div>

                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="todos">
                                    {(provided) => (
                                        <ul
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3"
                                        >
                                            {filteredAndSortedTodos.map((todo, index) => {
                                                const dueDateStatus = getDueDateStatus(todo.dueDate, todo.completed);
                                                const categoryInfo = getCategoryInfo(todo.category);

                                                return (
                                                    <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                                                        {(provided, snapshot) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`todo-item border-l-4 ${getPriorityColor(todo.priority)} ${todo.completed ? 'todo-completed' : ''
                                                                    } ${snapshot.isDragging ? 'shadow-lg scale-105' : ''} transition-all duration-200`}
                                                            >
                                                                <div className="flex items-center justify-between p-4">
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                                        >
                                                                            ⋮⋮
                                                                        </div>

                                                                        <input
                                                                            type="checkbox"
                                                                            checked={todo.completed}
                                                                            onChange={() => handleToggleTodo(todo.id)}
                                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                                        />

                                                                        {editingId === todo.id ? (
                                                                            <input
                                                                                type="text"
                                                                                value={editingText}
                                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                                onKeyPress={(e) => handleEditKeyPress(e, todo.id)}
                                                                                onBlur={() => handleSaveEdit(todo.id)}
                                                                                className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                                autoFocus
                                                                            />
                                                                        ) : (
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span
                                                                                        className={`cursor-pointer ${todo.completed
                                                                                                ? 'line-through text-gray-500 dark:text-gray-400'
                                                                                                : 'text-gray-800 dark:text-white'
                                                                                            }`}
                                                                                        onClick={() => handleStartEdit(todo.id, todo.text)}
                                                                                    >
                                                                                        {searchTerm ? (
                                                                                            <span dangerouslySetInnerHTML={{
                                                                                                __html: todo.text.replace(
                                                                                                    new RegExp(`(${searchTerm})`, 'gi'),
                                                                                                    '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>'
                                                                                                )
                                                                                            }} />
                                                                                        ) : (
                                                                                            todo.text
                                                                                        )}
                                                                                    </span>

                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                                                                                        {categoryInfo.name}
                                                                                    </span>

                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(todo.priority)}`}>
                                                                                        {todo.priority}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                                                                    <span>
                                                                                        Created: {new Date(todo.createdAt).toLocaleDateString()}
                                                                                    </span>

                                                                                    {todo.dueDate && (
                                                                                        <span className={dueDateStatus ? dueDateStatus.color : 'text-gray-600 dark:text-gray-400'}>
                                                                                            {dueDateStatus ? dueDateStatus.text : `Due: ${new Date(todo.dueDate).toLocaleDateString()}`}
                                                                                        </span>
                                                                                    )}

                                                                                    {todo.completedAt && (
                                                                                        <span className="text-green-600 dark:text-green-400">
                                                                                            Completed: {new Date(todo.completedAt).toLocaleDateString()}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex gap-2 items-center flex-wrap">
                                                                        <select
                                                                            value={todo.priority}
                                                                            onChange={(e) => handlePriorityChange(todo.id, e.target.value)}
                                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                        >
                                                                            <option value="low">Low</option>
                                                                            <option value="medium">Medium</option>
                                                                            <option value="high">High</option>
                                                                        </select>

                                                                        <select
                                                                            value={todo.category}
                                                                            onChange={(e) => handleCategoryChange(todo.id, e.target.value)}
                                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                        >
                                                                            {categories.map(category => (
                                                                                <option key={category.id} value={category.id}>
                                                                                    {category.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>

                                                                        <input
                                                                            type="date"
                                                                            value={todo.dueDate || ''}
                                                                            onChange={(e) => handleDueDateChange(todo.id, e.target.value)}
                                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                        />

                                                                        {editingId === todo.id ? (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleSaveEdit(todo.id)}
                                                                                    className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-sm hover:bg-green-200 dark:hover:bg-green-800"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleCancelEdit}
                                                                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleStartEdit(todo.id, todo.text)}
                                                                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleToggleTodo(todo.id)}
                                                                                    className={`px-3 py-1 rounded text-sm font-medium ${todo.completed
                                                                                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                                                                                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                                                                        }`}
                                                                                >
                                                                                    {todo.completed ? 'Undo' : 'Done'}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                                                    className="btn-danger"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    )}
                </div>

                {todos.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Statistics</h3>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm mb-6">
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-gray-800 dark:text-white">{todos.length}</div>
                                <div className="text-gray-600 dark:text-gray-400">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-green-600 dark:text-green-400">
                                    {todos.filter(todo => todo.completed).length}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-blue-600 dark:text-blue-400">
                                    {todos.filter(todo => !todo.completed).length}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Remaining</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-red-600 dark:text-red-400">
                                    {todos.filter(todo => todo.priority === 'high' && !todo.completed).length}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">High Priority</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-orange-600 dark:text-orange-400">
                                    {todos.filter(todo => todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed).length}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Overdue</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-2xl text-purple-600 dark:text-purple-400">
                                    {Math.round((todos.filter(todo => todo.completed).length / todos.length) * 100)}%
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Completion</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">By Category</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {categories.map(category => {
                                    const categoryTodos = todos.filter(todo => todo.category === category.id);
                                    const completed = categoryTodos.filter(todo => todo.completed).length;
                                    return (
                                        <div key={category.id} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${category.color}`}>
                                                {category.name}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-gray-900 dark:text-white">{categoryTodos.length}</div>
                                                <div className="text-gray-600 dark:text-gray-400">{completed} completed</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all') && (
                            <div className="border-t dark:border-gray-600 pt-4 mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Filtered View</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="font-semibold text-lg text-gray-800 dark:text-white">{filteredAndSortedTodos.length}</div>
                                            <div>Shown</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                                                {filteredAndSortedTodos.filter(todo => todo.completed).length}
                                            </div>
                                            <div>Completed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                                                {filteredAndSortedTodos.filter(todo => !todo.completed).length}
                                            </div>
                                            <div>Remaining</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                                                {filteredAndSortedTodos.length > 0 ? Math.round((filteredAndSortedTodos.filter(todo => todo.completed).length / filteredAndSortedTodos.length) * 100) : 0}%
                                            </div>
                                            <div>Completion</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t dark:border-gray-600 pt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                            💾 Your todos are automatically saved to your browser's local storage
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    <div className="mb-2">
                        🔄 Last saved: {todos.length > 0 ? 'Just now' : 'No data'} •
                        {darkMode ? ' 🌙 Dark Mode' : ' ☀️ Light Mode'}
                    </div>
                    <div>
                        Built with React, Vite, Tailwind CSS, and ❤️
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoApp;