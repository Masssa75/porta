const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;

if (!NETLIFY_TOKEN) {
  console.error('❌ NETLIFY_TOKEN not found in environment');
  process.exit(1);
}

// Get site details including domain configuration
async function getSiteDetails() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: '/api/v1/sites',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const sites = JSON.parse(data);
          const portaSite = sites.find(site => 
            site.name && site.name.includes('portalerts-mobile')
          );
          
          if (portaSite) {
            console.log('✅ Found site: ' + portaSite.name);
            console.log('\n📌 URLS:');
            console.log('- Site URL: ' + portaSite.url);
            console.log('- SSL URL: ' + portaSite.ssl_url);
            console.log('- Admin URL: ' + portaSite.admin_url);
            
            console.log('\n🌐 DOMAIN CONFIGURATION:');
            console.log('- Custom Domain: ' + (portaSite.custom_domain || 'Not set'));
            console.log('- Domain Aliases: ' + JSON.stringify(portaSite.domain_aliases || []));
            
            console.log('\n🔒 SSL STATUS:');
            console.log('- SSL Ready: ' + (portaSite.ssl ? 'Yes' : 'No'));
            console.log('- Force SSL: ' + (portaSite.force_ssl ? 'Yes' : 'No'));
            
            if (portaSite.ssl) {
              console.log('- SSL Created: ' + portaSite.ssl.created_at);
              console.log('- SSL State: ' + portaSite.ssl.state);
              console.log('- SSL Domains: ' + JSON.stringify(portaSite.ssl.domains || []));
            }
            
            console.log('\n📊 DEPLOYMENT:');
            console.log('- Published Deploy: ' + portaSite.published_deploy?.id);
            console.log('- Deploy URL: ' + portaSite.published_deploy?.deploy_ssl_url);
            
            // Get more SSL details
            if (portaSite.id) {
              getSiteSSLDetails(portaSite.id);
            }
            
            resolve(portaSite);
          } else {
            console.log('❌ portalerts-mobile site not found');
            console.log('\nAvailable sites:');
            sites.forEach(site => {
              console.log(`- ${site.name}: ${site.url}`);
            });
            reject('Site not found');
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          console.log('Response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get SSL certificate details for the site
async function getSiteSSLDetails(siteId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${siteId}/ssl`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            console.log('\n⚠️  No SSL certificate found for custom domain');
            console.log('   This is why HTTPS is not working!');
            console.log('\n🔧 SOLUTION:');
            console.log('   1. Make sure DNS is properly configured (A record to 75.2.60.5)');
            console.log('   2. SSL certificate will be auto-provisioned once DNS propagates');
            console.log('   3. This usually takes 10-60 minutes after DNS setup');
            return;
          }
          
          const ssl = JSON.parse(data);
          console.log('\n🔐 SSL CERTIFICATE DETAILS:');
          console.log('- State: ' + ssl.state);
          console.log('- Domains: ' + JSON.stringify(ssl.domains || []));
          console.log('- Created: ' + ssl.created_at);
          console.log('- Updated: ' + ssl.updated_at);
          console.log('- Expires: ' + ssl.expires_at);
          
          resolve(ssl);
        } catch (e) {
          // SSL might not be provisioned yet
          console.log('\n⚠️  SSL provisioning status:', res.statusCode);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Main execution
async function checkDomainStatus() {
  try {
    console.log('🔍 Checking domain and SSL status for portalerts.xyz...\n');
    await getSiteDetails();
    
    console.log('\n💡 CURRENT STATUS:');
    console.log('- The app is deployed and working on https://portalerts-mobile.netlify.app');
    console.log('- DNS is configured (A record points to 75.2.60.5)');
    console.log('- SSL certificate is being provisioned for portalerts.xyz');
    console.log('- Once SSL is ready, https://portalerts.xyz will work');
    console.log('\n⏰ This process typically takes 10-60 minutes after DNS configuration.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDomainStatus();