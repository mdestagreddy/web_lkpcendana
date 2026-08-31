import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Terjadi Kesalahan</h1>
                    <p style={{ marginBottom: '1.5rem', color: '#666' }}>{this.state.error?.message || 'Terjadi kesalahan tak terduga.'}</p>
                    <button onClick={this.handleReset} style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '1rem' }}>
                        Coba Lagi
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
