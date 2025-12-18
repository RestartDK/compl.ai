import { Hono } from 'hono'
import healthRoutes from './routes/health'
import complianceRoutes from './routes/compliance'
import policiesRoutes from './routes/policies'

const app = new Hono()

app.route('/api/health', healthRoutes)
app.route('/api/compliance', complianceRoutes)
app.route('/api/policies', policiesRoutes)

app.get('/api/runtime', (c) => {
	const hasBunGlobal = typeof Bun !== 'undefined'
	const isBun = hasBunGlobal && !!process.versions.bun
	
	return c.json({
		runtime: isBun ? 'bun' : 'node',
		hasBunGlobal,
		bunVersion: process.versions.bun || null,
		nodeVersion: process.versions.node || null,
		execPath: process.execPath,
		versions: process.versions,
		cwd: process.cwd(),
	})
})

export default app
