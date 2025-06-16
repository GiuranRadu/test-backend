const User = require('../Models/userModel');

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        status: 'failed',
        message: `No user found with id ${req.params.id}`
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User with id:${req.params.id} deleted successfully`
    });

  } catch (error) {
    res.status(500).json({
      status: 'failed',
      message: error.message
    });
  }
}