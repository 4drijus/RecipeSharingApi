using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Models;
using RecipeSharingApi.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, PasswordService passwordService, JwtService jwtService, IConfiguration configuration)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => 
                u.Username == dto.Username || u.Email == dto.Email);

        if (existingUser != null)
        {
            return BadRequest("Username or email already exists");
        }

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = _passwordService.HashPassword(dto.Password),
            Role = "User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created("", new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Role
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null)
        {
            return Unauthorized("Invalid username or password");
        }

        var passwordValid = _passwordService.VerifyPassword(dto.Password, user.PasswordHash);

        if (!passwordValid)
        {
            return Unauthorized("Invalid username or password");
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(
                _configuration.GetValue<int>("Jwt:RefreshTokenDays"))
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = _jwtService.GetAccessTokenExpiration()
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshDto dto)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (refreshToken == null)
        {
            return Unauthorized("Invalid refresh token");
        }

        if (refreshToken.RevokedAt != null)
        {
            return Unauthorized("Refresh token has been revoked");
        }

        if (refreshToken.ExpiresAt <= DateTime.UtcNow)
        {
            return Unauthorized("Refresh token has expired");
        }

        var user = refreshToken.User;

        if (user == null)
        {
            return Unauthorized("User not found");
        }

        // Revoke old refresh token
        refreshToken.RevokedAt = DateTime.UtcNow;

        // Generate new tokens
        var newAccessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:RefreshTokenDays"))
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);

        await _context.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            AccessTokenExpiresAt = _jwtService.GetAccessTokenExpiration()
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshDto dto)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (refreshToken == null)
        {
            return Unauthorized("Invalid refresh token");
        }

        if (refreshToken.RevokedAt != null)
        {
            return Unauthorized("Refresh token has already been revoked");
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid user identity");
        }

        if (refreshToken.UserId != userId)
        {
            return Forbid();
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            Id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Username = User.Identity?.Name,
            Role = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}