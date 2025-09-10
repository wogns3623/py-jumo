import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/waitings')({
  component: () => <div>Hello /waitings!</div>
})