import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';


export const routes: Routes = [


  {
    path: '',

    component: PublicLayoutComponent,

    children: [

      {
        path: '',

        loadComponent: () =>
          import('./pages/home/home.component')
            .then(m => m.HomeComponent)

      },
      {
        path:'services/:slug',
        
        loadComponent:()=> 
        import('./pages/service-detail/service-detail.component')
        .then(m=>m.ServiceDetailComponent)
        
        },

      {
        path: 'about',

        loadComponent: () =>
          import('./pages/about/about.component')
            .then(m => m.AboutComponent)

      },


      {
        path: 'services',

        loadComponent: () =>
          import('./pages/services/services.component')
            .then(m => m.ServicesComponent)

      },


      {
        path: 'gallery',

        loadComponent: () =>
          import('./pages/gallery/gallery.component')
            .then(m => m.GalleryComponent)

      },


      {
        path: 'resources',

        loadComponent: () =>
          import('./pages/resources/resources.component')
            .then(m => m.ResourcesComponent)

      },


      {
        path: 'contact',

        loadComponent: () =>
          import('./pages/contact/contact.component')
            .then(m => m.ContactComponent)

      },


      {
        path: 'login',

        loadComponent: () =>
          import('./pages/login/login.component')
            .then(m => m.LoginComponent)

      },


      {
        path: 'register',

        loadComponent: () =>
          import('./pages/register/register.component')
            .then(m => m.RegisterComponent)

      },


      {
        path: 'privacy-policy',

        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy.component')
            .then(m => m.PrivacyPolicyComponent)

      },


      {
        path: 'terms',

        loadComponent: () =>
          import('./pages/terms/terms.component')
            .then(m => m.TermsComponent)

      },
      {
        path: 'design-lab',

        loadComponent: () =>
          import('./pages/design-lab/design-lab.component')
            .then(m => m.DesignLabComponent)

      },
      {
        path: '**',
        loadComponent: () =>
        import('./pages/not-found/not-found.component')
        .then(
        component => component.NotFoundComponent
        )
       }
    ]

  },


  {
    path: '**',

    redirectTo: ''

  }


];
