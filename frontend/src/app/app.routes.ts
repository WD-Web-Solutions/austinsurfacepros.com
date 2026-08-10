import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

import { environment } from '../environments/environment';
import { adminGuard } from './core/guards/admin.guard';
import { demoAdminGuard } from './core/guards/demo-admin.guard';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

const publicBlogRoutes: Routes = environment.blog.useLocalRepository
  ? [
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/blog/blog-index.component').then(m => m.BlogIndexComponent)
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./pages/blog/blog-detail.component').then(m => m.BlogDetailComponent)
      }
    ]
  : [
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/blog/blog.component').then(m => m.BlogComponent)
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./pages/blog/blog-post-detail/blog-post-detail.component')
            .then(m => m.BlogPostDetailComponent)
      }
    ];

const localStudioRoutes: Routes = environment.blog.useLocalRepository
  ? [
      {
        path: 'admin/blogs',
        pathMatch: 'full',
        redirectTo: 'blog'
      },
      {
        path: 'admin/blogs/new',
        canActivate: [demoAdminGuard],
        loadComponent: () =>
          import('./pages/admin/blog-editor-page.component').then(m => m.BlogEditorPageComponent)
      },
      {
        path: 'admin/blogs/:id/edit',
        canActivate: [demoAdminGuard],
        loadComponent: () =>
          import('./pages/admin/blog-editor-page.component').then(m => m.BlogEditorPageComponent)
      },
      {
        path: 'admin/blogs/:id/delete',
        canActivate: [demoAdminGuard],
        loadComponent: () =>
          import('./pages/admin/blog-delete-page.component').then(m => m.BlogDeletePageComponent)
      }
    ]
  : [];

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'services/:slug',
        loadComponent: () =>
          import('./pages/service-detail/service-detail.component').then(m => m.ServiceDetailComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/services/services.component').then(m => m.ServicesComponent)
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(m => m.GalleryComponent)
      },
      ...publicBlogRoutes,
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then(m => m.ContactComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then(m => m.RegisterComponent)
      },
      ...localStudioRoutes,
      {
        path: 'admin/gallery',
        canActivate: [environment.gallery.useLocalRepository ? demoAdminGuard : adminGuard],
        loadComponent: () =>
          import('./pages/admin-gallery/gallery-admin.component').then(m => m.GalleryAdminComponent)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'admin/blog',
        pathMatch: 'full',
        redirectTo: 'blog'
      },
      {
        path: 'admin/blog/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin-blog/post-editor/post-editor.component').then(m => m.PostEditorComponent)
      },
      {
        path: 'admin/blog/:slug/edit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin-blog/post-editor/post-editor.component').then(m => m.PostEditorComponent)
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
      },
      {
        path: 'terms',
        loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent)
      },
      {
        path: 'design-lab',
        canMatch: [() => isDevMode()],
        loadComponent: () =>
          import('./pages/design-lab/design-lab.component').then(m => m.DesignLabComponent)
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
