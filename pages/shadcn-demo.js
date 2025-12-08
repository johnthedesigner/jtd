import { Button } from '@/components/ui/button'
import Layout from '@/components/Layout'

export default function ShadcnDemo() {
    return (
        <Layout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-8">shadcn/ui Demo</h1>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Button Variants</h2>
                        <div className="flex flex-wrap gap-4">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="link">Link</Button>
                            <Button variant="destructive">Destructive</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Button Sizes</h2>
                        <div className="flex items-center gap-4">
                            <Button size="sm">Small</Button>
                            <Button size="default">Default</Button>
                            <Button size="lg">Large</Button>
                            <Button size="icon">🚀</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Interactive Examples</h2>
                        <div className="flex gap-4">
                            <Button onClick={() => alert('Hello from shadcn/ui!')}>
                                Click me
                            </Button>
                            <Button disabled>Disabled</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
