import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button.tsx';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 ErrorBoundary caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-100 rounded-xl m-4">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-lg font-bold">Đã xảy ra lỗi</h2>
                    </div>
                    <p className="text-red-800 mb-4"><strong>Lỗi:</strong> {this.state.error?.message}</p>
                    <pre className="bg-white p-4 rounded-lg overflow-auto text-xs text-gray-600 mb-4 border border-red-100 max-h-40">
                        {this.state.error?.stack}
                    </pre>
                    <Button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Thử lại
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
