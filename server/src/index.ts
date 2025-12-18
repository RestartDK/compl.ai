import { Hono } from 'hono'
import healthRoutes from './routes/health'
import complianceRoutes from './routes/compliance'
import policiesRoutes from './routes/policies'

const app = new Hono()

app.route('/api/health', healthRoutes)
app.route('/api/compliance', complianceRoutes)
app.route('/api/policies', policiesRoutes)

export default app
