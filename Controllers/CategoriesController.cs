using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeSharingApi.Data;
using RecipeSharingApi.DTOs;
using RecipeSharingApi.Models;
using Microsoft.AspNetCore.Authorization;
using RecipeSharingApi.Services;

namespace RecipeSharingApi.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IImageStorageService _imageStorage;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        AppDbContext context,
        IImageStorageService imageStorage,
        ILogger<CategoriesController> logger)
    {
        _context = context;
        _imageStorage = imageStorage;
        _logger = logger;
    }

    // GET (api/categories)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ImageUrl = c.ImageUrl
        }).ToListAsync();

        return Ok(categories);
    }


    // GET (api/categories/id)
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _context.Categories.Where(c => c.Id == id)
        .Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ImageUrl = c.ImageUrl
        }).FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    // POST
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryDto categoryDto)
    {
        var category = new Category
        {
            Name = categoryDto.Name,
            Description = categoryDto.Description
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl
        };

        return CreatedAtAction(nameof(GetCategory), new
            { id = category.Id}, result);
    }

    /// <summary>Creates a category and uploads its image in one request.</summary>
    [HttpPost("with-image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<CategoryDto>> CreateCategoryWithImage(
        [FromForm] CreateCategoryWithImageRequest request,
        CancellationToken cancellationToken)
    {
        if (!_imageStorage.IsConfigured)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Nuotraukų saugykla nesukonfigūruota.");
        }

        if (!ImageUploadValidator.TryGetContentType(request.Image, out _))
        {
            return BadRequest("Pasirinkite JPEG, PNG arba WebP nuotrauką iki 5 MB.");
        }

        string imageUrl;
        try
        {
            imageUrl = await _imageStorage.UploadAsync(
                request.Image,
                "recipe-sharing/categories",
                cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Category image upload failed during category creation.");
            return Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Nepavyko įkelti kategorijos nuotraukos į saugyklą.");
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            ImageUrl = imageUrl
        };

        _context.Categories.Add(category);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            try
            {
                await _imageStorage.DeleteAsync(imageUrl, CancellationToken.None);
            }
            catch (ImageStorageException cleanupException)
            {
                _logger.LogError(cleanupException, "Could not clean up an image after category creation failed.");
            }

            throw;
        }

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl
        };

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, result);
    }

    // PUT
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategory (int id, CategoryDto categoryDto)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.Name = categoryDto.Name;
        category.Description = categoryDto.Description;

        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl
        });
    }

    /// <summary>Uploads or replaces a category image in Cloudinary.</summary>
    [HttpPost("{id:int}/image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    [ProducesResponseType(typeof(ImageUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ImageUploadResponse>> UploadCategoryImage(
        int id,
        IFormFile image,
        CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound();
        }

        if (!_imageStorage.IsConfigured)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Nuotraukų saugykla nesukonfigūruota.");
        }

        if (!ImageUploadValidator.TryGetContentType(image, out _))
        {
            return BadRequest("Pasirinkite JPEG, PNG arba WebP nuotrauką iki 5 MB.");
        }

        var previousImageUrl = category.ImageUrl;
        string uploadedImageUrl;

        try
        {
            uploadedImageUrl = await _imageStorage.UploadAsync(
                image,
                "recipe-sharing/categories",
                cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Category image upload failed for category {CategoryId}.", id);
            return Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Nepavyko įkelti kategorijos nuotraukos į saugyklą.");
        }

        category.ImageUrl = uploadedImageUrl;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            category.ImageUrl = previousImageUrl;
            try
            {
                await _imageStorage.DeleteAsync(uploadedImageUrl, CancellationToken.None);
            }
            catch (ImageStorageException cleanupException)
            {
                _logger.LogError(
                    cleanupException,
                    "Could not clean up an uploaded image after saving category {CategoryId} failed.",
                    id);
            }

            throw;
        }

        try
        {
            await _imageStorage.DeleteAsync(previousImageUrl, cancellationToken);
        }
        catch (ImageStorageException exception)
        {
            _logger.LogError(exception, "Could not delete the replaced image for category {CategoryId}.", id);
        }

        return Ok(new ImageUploadResponse(uploadedImageUrl));
    }


    // DELETE
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory (int id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
 }