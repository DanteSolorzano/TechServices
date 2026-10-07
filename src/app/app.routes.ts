import { Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
	{
		path: 'admin',
		component: AdminComponent,
		canActivate: [adminGuard]
	}
];
