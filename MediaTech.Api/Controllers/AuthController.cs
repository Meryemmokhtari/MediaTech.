using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MediaTech.Api.Data;
using MediaTech.Api.Models;

namespace MediaTech.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<AppUser> _hasher;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext context,
        IPasswordHasher<AppUser> hasher,
        IConfiguration configuration)
    {
        _context = context;
        _hasher = hasher;
        _configuration = configuration;
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup(SetupRequest request)
    {
        if (await _context.AppUsers.AnyAsync())
        {
            return Conflict(new
            {
                message = "Le compte administrateur est déjà configuré."
            });
        }

        var expectedKey = _configuration["Bootstrap:Key"];

        if (string.IsNullOrWhiteSpace(expectedKey) ||
            string.IsNullOrWhiteSpace(request.BootstrapKey))
        {
            return Unauthorized(new { message = "Clé de configuration invalide." });
        }

        var expectedBytes = Encoding.UTF8.GetBytes(expectedKey);
        var receivedBytes = Encoding.UTF8.GetBytes(request.BootstrapKey);

        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, receivedBytes))
        {
            return Unauthorized(new { message = "Clé de configuration invalide." });
        }

        var email = request.Email.Trim().ToLowerInvariant();

        if (email.Length > 254 || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email))
        {
            return BadRequest(new { message = "Adresse e-mail invalide." });
        }

        if (string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 10 ||
            request.Password.Length > 128)
        {
            return BadRequest(new
            {
                message = "Le mot de passe doit contenir entre 10 et 128 caractères."
            });
        }

        var user = new AppUser
        {
            Email = email,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _context.AppUsers.Add(user);
        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            message = "Administrateur créé. Vous pouvez vous connecter.",
            email = user.Email
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "E-mail et mot de passe requis." });
        }

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _context.AppUsers
            .SingleOrDefaultAsync(item => item.Email == email);

        if (user is null)
        {
            return Unauthorized(new { message = "E-mail ou mot de passe incorrect." });
        }

        var result = _hasher.VerifyHashedPassword(
            user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "E-mail ou mot de passe incorrect." });
        }

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            return StatusCode(500, new { message = "Configuration JWT manquante." });
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            email = user.Email,
            expiresAt = token.ValidTo
        });
    }
}

public class SetupRequest
{
    public string BootstrapKey { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
